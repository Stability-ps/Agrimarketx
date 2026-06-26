import { NextResponse } from "next/server";
import { createDiditVerificationSession } from "@/lib/didit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before starting verification." }, { status: 401 });
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
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("seller_verifications")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "approved") {
      return NextResponse.json({ error: "Your seller identity is already verified." }, { status: 409 });
    }

    const session = await createDiditVerificationSession({
      userId: user.id,
      email: profile?.email ?? user.email,
      fullName: profile?.full_name
    });

    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      didit_session_id: session.sessionId,
      status: "pending",
      decision: null,
      verification_score: null,
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
      email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null,
      raw_result: session.payload
    }, {
      onConflict: "user_id"
    });

    const { data: memberships } = await admin
      .from("farm_members")
      .select("farm_id")
      .eq("user_id", user.id);
    const farmIds = (memberships ?? []).map((membership) => membership.farm_id).filter(Boolean);

    if (farmIds.length > 0) {
      await admin
        .from("farms")
        .update({
          seller_verification_status: "pending_review",
          seller_verification_reason: null,
          seller_verification_submitted_at: new Date().toISOString()
        })
        .in("id", farmIds);
    }

    return NextResponse.json({ verificationUrl: session.verificationUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start verification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
