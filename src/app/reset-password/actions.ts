"use server";

import { redirect } from "next/navigation";
import { passwordPolicyError } from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/server";


export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const passwordMessage = passwordPolicyError(password);
  if (passwordMessage) {
    redirect(`/reset-password?message=${encodeURIComponent(passwordMessage)}` as never);
  }

  if (password !== confirmPassword) {
    redirect(`/reset-password?message=${encodeURIComponent("Confirm password must match password.")}` as never);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/reset-password?message=${encodeURIComponent("Your password reset link has expired. Please request a new reset email.")}` as never);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?message=${encodeURIComponent(error.message || "Could not update password. Please try again.")}` as never);
  }

  await supabase.auth.signOut();
  redirect(`/login?message=${encodeURIComponent("Password updated successfully. Please sign in with your new password.")}` as never);
}
