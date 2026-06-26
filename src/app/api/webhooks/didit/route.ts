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

function farmStatusForDiditStatus(status: string) {
  if (status === "approved") {
    return "verified";
  }

  if (status === "declined" || status === "resubmission_required") {
    return "rejected";
  }

  return "pending_review";
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
        .select("id, user_id, webhook_event_ids, phone_verified, phone_verified_at, email_verified, email_verified_at")
        .eq("didit_session_id", normalized.sessionId)
        .maybeSingle()
    : await admin
        .from("seller_verifications")
        .select("id, user_id, webhook_event_ids, phone_verified, phone_verified_at, email_verified, email_verified_at")
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

  const { data: verification, error: verificationError } = await admin
    .from("seller_verifications")
    .upsert({
      id: current?.id,
      user_id: userId,
      didit_session_id: normalized.sessionId,
      status: normalized.status,
      verification_score: normalized.score,
      decision: normalized.decision,
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
    .select("farm_id")
    .eq("user_id", verification.user_id);
  const farmIds = (memberships ?? []).map((membership) => membership.farm_id).filter(Boolean);

  if (farmIds.length > 0) {
    await admin
      .from("farms")
      .update({
        seller_verification_status: farmStatusForDiditStatus(normalized.status),
        seller_verification_reason: normalized.status === "approved" ? null : normalized.decision,
        seller_verified_at: normalized.status === "approved" ? new Date().toISOString() : null
      })
      .in("id", farmIds);
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
