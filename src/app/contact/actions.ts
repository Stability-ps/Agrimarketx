"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function go(path: string): never {
  redirect(path as never);
}

export async function createPublicContactEnquiry(formData: FormData) {
  const supabase = await createClient();
  const name = text(formData, "name");
  const email = text(formData, "email");
  const subject = text(formData, "subject");
  const message = text(formData, "message");

  if (!name || !email || !subject || !message) {
    go(`/contact?message=${encodeURIComponent("Please add your name, email, subject and message.")}`);
  }

  const { error } = await supabase.from("public_contact_enquiries").insert({
    name,
    email,
    enquiry_type: text(formData, "enquiryType") ?? "support",
    subject,
    message
  });

  if (error) {
    go(`/contact?message=${encodeURIComponent(error.message)}`);
  }

  go(`/contact?message=${encodeURIComponent("Thanks. Your message was sent to AgriMarketX support.")}`);
}
