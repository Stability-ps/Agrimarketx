"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { createAdminClient } from "@/lib/supabase/admin";
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

  return (
    message.includes("smtp") ||
    message.includes("authentication failed") ||
    message.includes("error sending confirmation") ||
    message.includes("confirmation email") ||
    message.includes("unexpected_failure")
  );
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
  const sellerType = String(formData.get("sellerType") ?? "individual") === "business" ? "business" : "individual";

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    signupError({ accountType, email, fullName, message: "Please complete all fields.", phone, sellerType });
  }

  const passwordMessage = validPassword(password);

  if (passwordMessage) {
    signupError({ accountType, email, fullName, message: passwordMessage, phone, sellerType });
  }

  if (password !== confirmPassword) {
    signupError({ accountType, email, fullName, message: "Confirm password must match password.", phone, sellerType });
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
      try {
        const admin = createAdminClient();
        const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            phone,
            account_role: accountRole,
            account_type_selected: true,
            seller_type: sellerType
          }
        });

        if (!adminError && adminData.user) {
          go(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Account created. You can sign in now.")}&next=${encodeURIComponent(next)}`);
        }

        const adminMessage = readableAuthError(adminError);
        if (adminMessage.toLowerCase().includes("already") || adminMessage.toLowerCase().includes("registered") || adminMessage.toLowerCase().includes("exists")) {
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
      } catch {
        // Fall through to the friendly error below.
      }

      signupError({
        accountType,
        email,
        fullName,
        message: "We could not send the confirmation email. Please try again shortly.",
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
