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
  const next = String(formData.get("next") ?? "/marketplace");

  if (!email || !password) {
    go(`/login?message=${encodeURIComponent("Enter your email and password.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    go(`/signup?email=${encodeURIComponent(email)}&message=${encodeURIComponent("We could not sign you in. Create an account with this email or check your password.")}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type_selected")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (profile && !profile.account_type_selected) {
    go("/account/type");
  }

  go(next);
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
  redirect("/");
}
