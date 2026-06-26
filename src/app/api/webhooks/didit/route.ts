import { NextResponse } from "next/server";
import { normalizeDiditWebhook, verifyDiditWebhookSignature } from "@/lib/didit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function header(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value) {
      return value;
    }
  }

  return null;
}

function facialStatusForDiditStatus(status: string) {
  if (status === "approved") {
    return "verified";
  }

  if (status === "declined" || status === "resubmission_required") {
    return "failed";
  }

  return "pending";
}

function finalStatusForVerification({
  diditStatus,
  sellerType,
  documentStatus,
  emailVerified,
  phoneVerified
}: {
  diditStatus: string;
  sellerType?: string | null;
  documentStatus?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
}) {
  if (diditStatus !== "approved") {
    return sellerType === "business" && documentStatus === "approved"
      ? "documents_approved_pending_facial_verification"
      : "pending";
  }

  if (!emailVerified || !phoneVerified) {
    return "pending";
  }

  if (sellerType === "business" && documentStatus !== "approved") {
    return documentStatus === "submitted" ? "documents_submitted" : "pending";
  }

  return "verified";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureCheck = verifyDiditWebhookSignature({
    rawBody,
    secret: process.env.DIDIT_WEBHOOK_SECRET,
    signatureV2: header(request, ["x-signature-v2", "x-didit-signature-v2", "didit-signature-v2"]),
    signature: header(request, ["x-signature", "x-didit-signature", "didit-signature"]),
    signatureSimple: header(request, ["x-signature-simple", "x-didit-signature-simple", "didit-signature-simple"]),
    timestamp: header(request, ["x-timestamp", "x-didit-timestamp", "didit-timestamp"])
  });

  if (!signatureCheck.ok) {
    return NextResponse.json({ error: signatureCheck.reason }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const normalized = normalizeDiditWebhook(payload);
  const admin = createAdminClient();

  if (normalized.eventId) {
    const { data: duplicateEvent } = await admin
      .from("seller_verification_events")
      .select("id")
      .eq("event_id", normalized.eventId)
      .maybeSingle();

    if (duplicateEvent) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  if (!normalized.sessionId && !normalized.userId) {
    await admin.from("seller_verification_events").insert({
      event_id: normalized.eventId,
      event_type: normalized.eventType,
      status: normalized.status,
      payload,
      processed: false,
      error: "Missing Didit session id and vendor user id."
    });

    return NextResponse.json({ error: "Missing Didit session id and vendor user id." }, { status: 400 });
  }

  const { data: current } = normalized.sessionId
    ? await admin
      .from("seller_verifications")
        .select("id, user_id, webhook_event_ids, phone_verified, phone_verified_at, email_verified, email_verified_at, seller_type, document_status, admin_verification_override, seller_verification_status")
        .eq("didit_session_id", normalized.sessionId)
        .maybeSingle()
    : await admin
        .from("seller_verifications")
        .select("id, user_id, webhook_event_ids, phone_verified, phone_verified_at, email_verified, email_verified_at, seller_type, document_status, admin_verification_override, seller_verification_status")
        .eq("user_id", normalized.userId ?? "")
        .maybeSingle();

  const userId = current?.user_id ?? normalized.userId;

  if (!userId) {
    await admin.from("seller_verification_events").insert({
      didit_session_id: normalized.sessionId,
      event_id: normalized.eventId,
      event_type: normalized.eventType,
      status: normalized.status,
      payload,
      processed: false,
      error: "Could not map Didit webhook to an AgriMarketX user."
    });

    return NextResponse.json({ error: "Could not map webhook to seller." }, { status: 400 });
  }

  const nextEventIds = normalized.eventId
    ? Array.from(new Set([...(current?.webhook_event_ids ?? []), normalized.eventId]))
    : current?.webhook_event_ids ?? [];
  const nextFacialStatus = facialStatusForDiditStatus(normalized.status);
  const nextSellerStatus = current?.admin_verification_override
    ? current.seller_verification_status
    : finalStatusForVerification({
        diditStatus: normalized.status,
        sellerType: current?.seller_type,
        documentStatus: current?.document_status,
        emailVerified: current?.email_verified,
        phoneVerified: current?.phone_verified
      });

  const { data: verification, error: verificationError } = await admin
    .from("seller_verifications")
    .upsert({
      id: current?.id,
      user_id: userId,
      didit_session_id: normalized.sessionId,
      status: normalized.status,
      verification_score: normalized.score,
      decision: normalized.decision,
      facial_verification_status: nextFacialStatus,
      seller_verification_status: nextSellerStatus,
      phone_verified: current?.phone_verified ?? false,
      phone_verified_at: current?.phone_verified_at ?? null,
      email_verified: current?.email_verified ?? false,
      email_verified_at: current?.email_verified_at ?? null,
      webhook_event_ids: nextEventIds,
      raw_result: payload
    }, {
      onConflict: "user_id"
    })
    .select("id, user_id")
    .single();

  if (verificationError) {
    await admin.from("seller_verification_events").insert({
      didit_session_id: normalized.sessionId,
      event_id: normalized.eventId,
      event_type: normalized.eventType,
      status: normalized.status,
      payload,
      processed: false,
      error: verificationError.message
    });

    return NextResponse.json({ error: verificationError.message }, { status: 500 });
  }

  await admin.from("seller_verification_events").insert({
    seller_verification_id: verification.id,
    didit_session_id: normalized.sessionId,
    event_id: normalized.eventId,
    event_type: normalized.eventType,
    status: normalized.status,
    payload,
    processed: true
  });

  const { data: memberships } = await admin
    .from("farm_members")
    .select("farm_id, farms(seller_type, document_status, email_verified, phone_verified, admin_verification_override, seller_verification_status)")
    .eq("user_id", verification.user_id);
  const farmIds = (memberships ?? []).map((membership) => membership.farm_id).filter(Boolean);

  if (farmIds.length > 0) {
    const now = new Date().toISOString();
    await Promise.all((memberships ?? []).map(async (membership) => {
      const farm = Array.isArray(membership.farms) ? membership.farms[0] : membership.farms;
      const farmNextStatus = farm?.admin_verification_override
        ? farm.seller_verification_status
        : finalStatusForVerification({
            diditStatus: normalized.status,
            sellerType: farm?.seller_type ?? current?.seller_type,
            documentStatus: farm?.document_status ?? current?.document_status,
            emailVerified: farm?.email_verified ?? current?.email_verified,
            phoneVerified: farm?.phone_verified ?? current?.phone_verified
          });

      await admin
        .from("farms")
        .update({
          facial_verification_status: nextFacialStatus,
          seller_verification_status: farmNextStatus,
          seller_verification_reason: normalized.status === "approved" ? null : normalized.decision,
          seller_verified_at: farmNextStatus === "verified" ? now : null,
          verification_updated_at: now
        })
        .eq("id", membership.farm_id);
    }));
  }

  await admin.from("app_notifications").insert({
    user_id: verification.user_id,
    title: normalized.status === "approved" ? "Identity verification approved" : "Identity verification updated",
    body: normalized.status === "approved"
      ? "Your AgriMarketX seller profile is now Identity Verified."
      : `Your Didit verification status is ${normalized.status.replaceAll("_", " ")}.`,
    type: "verification",
    link_url: "/seller/verification"
  });

  return NextResponse.json({ ok: true });
}
