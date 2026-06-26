import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkTwilioVerifyCode } from "@/lib/twilio-verify";

async function syncFarmVerificationFlags(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  emailVerified: boolean,
  emailVerifiedAt: string | null,
  phoneVerified: boolean,
  phoneVerifiedAt: string | null
) {
  const { data: memberships } = await admin
    .from("farm_members")
    .select("farm_id")
    .eq("user_id", userId);

  const farmIds = (memberships ?? []).map((membership: any) => membership.farm_id).filter(Boolean);
  if (farmIds.length === 0) {
    return;
  }

  const updatePayload: Record<string, unknown> = {
    email_verified: emailVerified,
    email_verified_at: emailVerifiedAt,
    phone_verified: phoneVerified,
    phone_verified_at: phoneVerifiedAt,
    seller_verification_status: phoneVerified && emailVerified ? "verified" : "pending_review",
    verification_updated_at: new Date().toISOString()
  };

  if (phoneVerified && emailVerified) {
    updatePayload.seller_verified_at = new Date().toISOString();
  }

  await admin
    .from("farms")
    .update(updatePayload)
    .in("id", farmIds)
    .eq("admin_verification_override", false);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in before verifying your phone number." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const phoneNumber = typeof body.phone_number === "string" ? body.phone_number : "";
  const otpCode = typeof body.otp_code === "string" ? body.otp_code : "";

  if (!phoneNumber.trim() || !otpCode.trim()) {
    return NextResponse.json({ error: "Enter your mobile number and OTP code." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const result = await checkTwilioVerifyCode(phoneNumber, otpCode);

    if (!result.approved) {
      return NextResponse.json({ error: "The code is incorrect or expired.", status: result.status }, { status: 400 });
    }

    const verifiedAt = new Date().toISOString();
    await admin.from("profiles").update({ phone: result.phoneNumber }).eq("id", user.id);
    const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
    const emailVerifiedAt = user.email_confirmed_at ?? user.confirmed_at ?? null;
    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      phone_verified: true,
      phone_verified_at: verifiedAt,
      email_verified: emailVerified,
      email_verified_at: emailVerifiedAt
    }, {
      onConflict: "user_id"
    });
    await syncFarmVerificationFlags(admin, user.id, emailVerified, emailVerifiedAt, true, verifiedAt);

    return NextResponse.json({ ok: true, phoneNumber: result.phoneNumber, verifiedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
