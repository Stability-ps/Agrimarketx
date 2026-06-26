const TWILIO_API_BASE = "https://verify.twilio.com/v2";

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("Missing Twilio Verify configuration.");
  }

  return { accountSid, authToken, serviceSid };
}

function twilioAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim().replace(/\s+/g, "");

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  if (trimmed.startsWith("0")) {
    return `+27${trimmed.slice(1)}`;
  }

  if (trimmed.startsWith("27")) {
    return `+${trimmed}`;
  }

  return trimmed;
}

export async function sendTwilioVerifyCode(phoneNumber: string) {
  const config = twilioConfig();
  const to = normalizePhoneNumber(phoneNumber);
  const response = await fetch(`${TWILIO_API_BASE}/Services/${config.serviceSid}/Verifications`, {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(config.accountSid, config.authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: to,
      Channel: "sms"
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Could not send verification code.";
    throw new Error(message);
  }

  return { phoneNumber: to, payload };
}

export async function checkTwilioVerifyCode(phoneNumber: string, code: string) {
  const config = twilioConfig();
  const to = normalizePhoneNumber(phoneNumber);
  const response = await fetch(`${TWILIO_API_BASE}/Services/${config.serviceSid}/VerificationCheck`, {
    method: "POST",
    headers: {
      Authorization: twilioAuthHeader(config.accountSid, config.authToken),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: to,
      Code: code.trim()
    })
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === "string" ? payload.message : "Could not verify code.";
    throw new Error(message);
  }

  return {
    phoneNumber: to,
    approved: payload?.status === "approved" || payload?.valid === true,
    status: typeof payload?.status === "string" ? payload.status : null,
    payload
  };
}

export function cleanPhoneNumber(phoneNumber: string) {
  return normalizePhoneNumber(phoneNumber);
}
