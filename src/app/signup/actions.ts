"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getBaseUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  return origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
}

function go(path: string): never {
  redirect(path as never);
}

function signupError({
  accountType,
  email,
  fullName,
  message,
  phone
}: {
  accountType: string;
  email: string;
  fullName: string;
  message: string;
  phone: string;
}) {
  const params = new URLSearchParams({
    accountType,
    email,
    fullName,
    message,
    phone
  });

  go(`/signup?${params.toString()}`);
}

function validPassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must have at least one uppercase character.";
  }

  return null;
}

export async function createAccount(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const accountType = String(formData.get("accountType") ?? "buyer");
  const accountRole = accountType === "seller" ? "seller" : "buyer";

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    signupError({ accountType, email, fullName, message: "Please complete all fields.", phone });
  }

  const passwordMessage = validPassword(password);

  if (passwordMessage) {
    signupError({ accountType, email, fullName, message: passwordMessage, phone });
  }

  if (password !== confirmPassword) {
    signupError({ accountType, email, fullName, message: "Confirm password must match password.", phone });
  }

  const next = accountRole === "seller" ? "/onboarding" : "/marketplace";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: fullName,
        phone,
        account_role: accountRole,
        account_type_selected: true
      }
    }
  });

  if (error) {
    signupError({ accountType, email, fullName, message: error.message, phone });
  }

  if (data.session) {
    go(next);
  }

  go(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Account created. Check your email to confirm, then sign in.")}`);
}
