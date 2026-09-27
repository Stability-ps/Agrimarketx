import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createDiditVerificationSession } from "@/lib/didit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before starting verification." }, { status: 401 });
  }

  if (!(await checkRateLimit("diditSession", user.id))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, account_role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.account_role ?? "buyer";

  if (role === "buyer") {
    return NextResponse.json({ error: "Only seller accounts need identity verification." }, { status: 403 });
  }

  if (role === "admin" || role === "super_admin") {
    return NextResponse.json({ error: "Admin accounts do not use public seller verification." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const purpose = body?.purpose === "representative" ? "representative" : "seller_facial";
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("seller_verifications")
      .select("status, seller_verification_status, seller_type, document_status, facial_verification_status, facial_didit_session_id, admin_verification_override")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.facial_verification_status === "verified" || existing?.status === "approved") {
      return NextResponse.json({ error: "Your seller identity is already verified." }, { status: 409 });
    }

    const { data: memberships } = await admin
      .from("farm_members")
      .select("farm_id, farms(seller_type, document_status, admin_verification_override)")
      .eq("user_id", user.id);
    const farmIds = (memberships ?? []).map((membership) => membership.farm_id).filter(Boolean);
    const farm = Array.isArray(memberships?.[0]?.farms) ? memberships?.[0]?.farms[0] : memberships?.[0]?.farms;
    const sellerType = existing?.seller_type ?? farm?.seller_type ?? "individual";
    const documentStatus = existing?.document_status ?? farm?.document_status ?? "not_submitted";

    if (purpose === "seller_facial" && sellerType === "business" && documentStatus !== "approved") {
      return NextResponse.json({ error: "Business documents must be approved before facial verification." }, { status: 403 });
    }

    const session = await createDiditVerificationSession({
      userId: user.id,
      email: profile?.email ?? user.email,
      fullName: profile?.full_name
    });

    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      didit_session_id: session.sessionId,
      facial_didit_session_id: purpose === "seller_facial" ? session.sessionId : existing?.facial_didit_session_id,
      status: "pending",
      decision: null,
      verification_score: null,
      seller_type: sellerType,
      document_status: documentStatus,
      facial_verification_status: "pending",
      seller_verification_status: existing?.admin_verification_override ? existing.seller_verification_status : "facial_verification_pending",
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
      email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null,
      raw_result: session.payload
    }, {
      onConflict: "user_id"
    });

    if (farmIds.length > 0) {
      await admin
        .from("farms")
        .update({
          facial_didit_session_id: session.sessionId,
          facial_verification_status: "pending",
          seller_verification_status: "facial_verification_pending",
          seller_verification_reason: null,
          seller_verification_submitted_at: new Date().toISOString()
        })
        .in("id", farmIds)
        .eq("admin_verification_override", false);
    }

    return NextResponse.json({ verificationUrl: session.verificationUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start verification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
