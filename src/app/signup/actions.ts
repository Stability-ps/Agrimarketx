"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { passwordPolicyError } from "@/lib/password-policy";
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
  duplicate,
  email,
  fullName,
  message,
  phone,
  sellerType
}: {
  accountType: string;
  duplicate?: boolean;
  email: string;
  fullName: string;
  message: string;
  phone: string;
  sellerType: string;
}) {
  const params = new URLSearchParams({
    accountType,
    email,
    fullName,
    message,
    phone,
    sellerType
  });

  if (duplicate) {
    params.set("duplicate", "1");
  }

  go(`/signup?${params.toString()}`);
}

function readableAuthError(error: unknown) {
  if (error instanceof Error && error.message.trim() && error.message.trim() !== "{}") {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message && message !== "{}") {
      return message;
    }
  }

  return "We could not create your account. Please try again.";
}

function isConfirmationDeliveryFailure(error: unknown) {
  const message = readableAuthError(error).toLowerCase();
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "").toLowerCase()
    : "";

  return (
    code === "unexpected_failure" ||
    message.includes("smtp") ||
    message.includes("authentication failed") ||
    message.includes("error sending confirmation") ||
    message.includes("confirmation email") ||
    message.includes("unexpected_failure")
  );
}


export async function createAccount(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const accountType = String(formData.get("accountType") ?? "buyer");
  const accountRole = accountType === "seller" ? "seller" : "buyer";
  const sellerType = String(formData.get("sellerType") ?? "individual") === "business" ? "business" : "individual";

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    signupError({ accountType, email, fullName, message: "Please complete all fields.", phone, sellerType });
  }

  const passwordMessage = passwordPolicyError(password);

  if (passwordMessage) {
    signupError({ accountType, email, fullName, message: passwordMessage, phone, sellerType });
  }

  if (password !== confirmPassword) {
    signupError({ accountType, email, fullName, message: "Confirm password must match password.", phone, sellerType });
  }

  if (!(await checkRateLimit("signup"))) {
    signupError({ accountType, email, fullName, message: RATE_LIMIT_MESSAGE, phone, sellerType });
  }

  const existingUser = await findAuthUserByEmail(email);

  if (existingUser === undefined) {
    signupError({
      accountType,
      email,
      fullName,
      message: "Something went wrong. Please try again.",
      phone,
      sellerType
    });
  }

  if (existingUser) {
    signupError({
      accountType,
      duplicate: true,
      email,
      fullName,
      message: "An account with this email address already exists. Please sign in or reset your password if you’ve forgotten it.",
      phone,
      sellerType
    });
  }

  const next = accountRole === "seller" ? `/onboarding?sellerType=${sellerType}` : "/marketplace";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getBaseUrl()}/auth/callback?authAction=confirm_email&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`,
      data: {
        full_name: fullName,
        phone,
        account_role: accountRole,
        account_type_selected: true,
        seller_type: sellerType
      }
    }
  });

  if (error) {
    const errorMessage = readableAuthError(error);
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes("already") || lowerMessage.includes("registered") || lowerMessage.includes("exists")) {
      signupError({
        accountType,
        duplicate: true,
        email,
        fullName,
        message: "An account with this email address already exists. Please sign in or reset your password if you’ve forgotten it.",
        phone,
        sellerType
      });
    }

    if (isConfirmationDeliveryFailure(error)) {
      // Never auto-confirm an address we could not email: an unverified email
      // must not become "verified" just because SMTP failed. Supabase does not
      // keep the account when the confirmation email fails, so retrying later
      // is safe.
      signupError({
        accountType,
        email,
        fullName,
        message: "We couldn't send your confirmation email right now, so your account was not created. Please try again in a few minutes. If this keeps happening, contact support@agrimarketx.com.",
        phone,
        sellerType
      });
    }

    signupError({ accountType, email, fullName, message: errorMessage, phone, sellerType });
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    signupError({
      accountType,
      duplicate: true,
      email,
      fullName,
      message: "An account with this email address already exists. Please sign in or reset your password if you’ve forgotten it.",
      phone,
      sellerType
    });
  }

  if (data.session) {
    go(next);
  }

  go(`/signup/confirm?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Account created. Check your email to confirm, then sign in.")}`);
}
