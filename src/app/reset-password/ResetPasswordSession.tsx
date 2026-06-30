"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordSession() {
  const [message, setMessage] = useState("Checking reset link...");

  useEffect(() => {
    let cancelled = false;

    async function prepareSession() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          setMessage(error ? "This reset link is invalid or expired. Please request a new one." : "Reset link verified. Create your new password below.");
        }

        if (!error) {
          window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!cancelled) {
        setMessage(user ? "Create your new password below." : "Open the reset link from your email to create a new password.");
      }
    }

    void prepareSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mb-4 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-sm font-medium text-green-950">
      {message}
    </div>
  );
}
