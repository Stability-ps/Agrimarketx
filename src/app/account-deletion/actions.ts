"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

export async function requestAccountDeletion(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const requestedSource = String(formData.get("source") ?? "web");
  const source = requestedSource === "app" ? "app" : "web";

  if (!email || !email.includes("@")) {
    go(`/account-deletion?status=error&message=${encodeURIComponent("Enter the email address linked to your AgriMarketX account.")}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email && user.email.toLowerCase() !== email) {
    go(`/account-deletion?status=error&message=${encodeURIComponent("For a signed-in request, use the email address linked to your current account.")}`);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("account_deletion_requests").insert({
      user_id: user?.id ?? null,
      email,
      reason,
      source,
      status: "requested"
    });
    if (error) throw error;
  } catch {
    go(`/account-deletion?status=error&message=${encodeURIComponent("We could not submit your deletion request. Please try again or contact support@agrimarketx.co.za.")}`);
  }

  go(`/account-deletion?status=success&message=${encodeURIComponent("Your account deletion request has been received. AgriMarketX will verify the request and process the associated account data in accordance with applicable retention obligations.")}`);
}
