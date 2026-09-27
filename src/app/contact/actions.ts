"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function go(path: string): never {
  redirect(path as never);
}

export async function createPublicContactEnquiry(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const subject = text(formData, "subject");
  const message = text(formData, "message");

  if (!name || !email || !subject || !message) {
    go(`/contact?message=${encodeURIComponent("Please add your name, email, subject and message.")}`);
  }

  if (!(await checkRateLimit("contactForm"))) {
    go(`/contact?message=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`);
  }

  const { error } = await createAdminClient().from("public_contact_enquiries").insert({
    name,
    email,
    enquiry_type: text(formData, "enquiryType") ?? "support",
    subject,
    message
  });

  if (error) {
    go(`/contact?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  go(`/contact?message=${encodeURIComponent("Thanks. Your message was sent to AgriMarketX support.")}`);
}
