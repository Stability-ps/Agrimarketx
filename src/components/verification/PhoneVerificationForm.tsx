"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function PhoneVerificationForm({
  defaultPhone,
  verified
}: {
  defaultPhone?: string | null;
  verified: boolean;
}) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(verified);

  async function sendCode() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send code.");
      }

      setPhoneNumber(payload.phoneNumber ?? phoneNumber);
      setCodeSent(true);
      setMessage("Code sent. Check your SMS.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/phone/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not verify code.");
      }

      setIsVerified(true);
      setMessage("Mobile number verified.");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not verify code.");
    } finally {
      setLoading(false);
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-900">
        <CheckCircle2 size={18} />
        Mobile number verified
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      {message ? <p className="rounded-md bg-green-50 p-2 text-sm font-semibold text-green-900">{message}</p> : null}
      {error ? <p className="rounded-md bg-amber-50 p-2 text-sm font-semibold text-amber-900">{error}</p> : null}
      <label className="grid gap-1 text-sm font-bold">
        Mobile number
        <input className="field" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="e.g. 082 123 4567" />
      </label>
      <button className="secondary-button w-full sm:w-fit" type="button" onClick={sendCode} disabled={loading || phoneNumber.trim().length === 0}>
        {codeSent ? "Resend OTP" : "Send OTP"}
      </button>
      {codeSent ? (
        <>
          <label className="grid gap-1 text-sm font-bold">
            OTP code
            <input className="field" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="Enter SMS code" inputMode="numeric" />
          </label>
          <button className="primary-button w-full sm:w-fit" type="button" onClick={verifyCode} disabled={loading || otpCode.trim().length === 0}>
            Verify Mobile Number
          </button>
        </>
      ) : null}
    </div>
  );
}
