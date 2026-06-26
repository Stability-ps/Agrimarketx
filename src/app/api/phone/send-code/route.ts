import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cleanPhoneNumber, sendTwilioVerifyCode } from "@/lib/twilio-verify";

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

  if (!phoneNumber.trim()) {
    return NextResponse.json({ error: "Enter a mobile number first." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("seller_verifications")
    .select("phone_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.phone_verified) {
    return NextResponse.json({ error: "This mobile number is already verified." }, { status: 409 });
  }

  try {
    const result = await sendTwilioVerifyCode(phoneNumber);

    await admin.from("profiles").update({ phone: result.phoneNumber }).eq("id", user.id);
    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      phone_verified: false,
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
      email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
    }, {
      onConflict: "user_id"
    });

    return NextResponse.json({ ok: true, phoneNumber: result.phoneNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send verification code.";
    return NextResponse.json({ error: message, phoneNumber: cleanPhoneNumber(phoneNumber) }, { status: 500 });
  }
}
