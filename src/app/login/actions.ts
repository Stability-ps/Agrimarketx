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

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    go(`/login?message=${encodeURIComponent("Enter your email and password.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const lowerMessage = error.message.toLowerCase();
    if (lowerMessage.includes("email") && (lowerMessage.includes("confirm") || lowerMessage.includes("verified"))) {
      go(`/login?email=${encodeURIComponent(email)}&unconfirmed=1&message=${encodeURIComponent("Your email address has not been confirmed yet. Please check your inbox and confirm your email before logging in.")}`);
    }

    go(`/signup?email=${encodeURIComponent(email)}&message=${encodeURIComponent("We could not sign you in. Create an account with this email or check your password.")}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type_selected, account_role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (profile && !profile.account_type_selected) {
    go("/account/type");
  }

  const role = profile?.account_role ?? "buyer";
  const defaultRoute = role === "admin" || role === "super_admin"
    ? "/admin"
    : role === "seller"
      ? "/dashboard"
      : "/marketplace";
  const safeNext = requestedNext.startsWith("/")
    && !requestedNext.startsWith("/login")
    && !requestedNext.startsWith("/signup")
    && requestedNext !== "/onboarding"
    ? requestedNext
    : defaultRoute;

  go(safeNext);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    go(`/login?message=${encodeURIComponent("Enter your email address first, then choose Forgot password.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getBaseUrl()}/login`
  });

  if (error) {
    go(`/login?message=${encodeURIComponent(error.message)}`);
  }

  go(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("If that email exists, a password reset link has been sent.")}`);
}

export async function resendConfirmationEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/login");

  if (!email) {
    go(`/login?message=${encodeURIComponent("Enter your email address first, then choose Resend confirmation email.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${await getBaseUrl()}/auth/callback?authAction=confirm_email&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`
    }
  });

  if (error) {
    go(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent(error.message)}`);
  }

  go(`/signup/confirm?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Confirmation email resent. Please check your inbox and spam folder.")}`);
}

export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/account/type");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error || !data.url) {
    go(`/login?message=${encodeURIComponent(error?.message ?? "Could not start Google login.")}`);
  }

  go(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=You have been logged out.");
}
