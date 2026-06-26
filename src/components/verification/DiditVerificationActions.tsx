"use client";

import { useState } from "react";

export function DiditVerificationActions({
  label = "Start Verification",
  purpose = "seller_facial"
}: {
  label?: string;
  purpose?: "seller_facial" | "representative";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startVerification() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose })
      });
      const payload = await response.json();

      if (!response.ok || !payload.verificationUrl) {
        throw new Error(payload.error ?? "Could not start verification.");
      }

      window.location.href = payload.verificationUrl;
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start verification.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      {error ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p> : null}
      <button className="primary-button w-full sm:w-fit" type="button" onClick={startVerification} disabled={loading}>
        {loading ? "Opening Didit..." : label}
      </button>
    </div>
  );
}
