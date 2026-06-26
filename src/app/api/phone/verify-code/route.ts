import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkTwilioVerifyCode } from "@/lib/twilio-verify";

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
    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      phone_verified: true,
      phone_verified_at: verifiedAt,
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
      email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
    }, {
      onConflict: "user_id"
    });

    return NextResponse.json({ ok: true, phoneNumber: result.phoneNumber, verifiedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
