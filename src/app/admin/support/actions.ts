"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/privileged-reads";

function go(path: string): never {
  redirect(path as never);
}

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function updateSupportTicket(formData: FormData) {
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase } = await requirePlatformAdmin();
  const ticketId = text(formData, "ticketId");
  const status = text(formData, "status") ?? "in_progress";
  const adminNote = text(formData, "adminNote");

  if (!ticketId) {
    go("/admin/support");
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status,
      admin_note: adminNote,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId);

  if (error) {
    go(`/admin/support?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/admin/support");
  go(`/admin/support?message=${encodeURIComponent("Support ticket updated.")}`);
}
