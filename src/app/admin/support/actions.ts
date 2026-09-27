"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function updateSupportTicket(formData: FormData) {
  const supabase = await createClient();
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
