"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";

function go(path: string): never {
  redirect(path as never);
}

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function startMarketplaceConversation(formData: FormData) {
  const supabase = await createClient();
  const listingId = text(formData, "listingId");
  const firstMessage = text(formData, "message") ?? "Hi, I am interested in this listing.";
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go(`/login?next=${encodeURIComponent("/marketplace")}&message=${encodeURIComponent("Sign in to chat with sellers.")}`);
  }

  if (!listingId) {
    go("/marketplace");
  }

  const { data: listing, error: listingError } = await supabase
    .from("marketplace_listings")
    .select("id, title, seller_farm_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    go(`/marketplace?message=${encodeURIComponent(listingError?.message ?? "Listing not found.")}`);
  }

  await supabase.rpc("increment_listing_metric", {
    listing_id: listing.id,
    metric: "chat"
  });

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      type: "marketplace",
      subject: listing.title,
      listing_id: listing.id,
      buyer_user_id: user.id,
      seller_farm_id: listing.seller_farm_id,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error || !conversation) {
    go(`/marketplace?message=${encodeURIComponent(error?.message ?? "Could not start chat.")}`);
  }

  await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.id, role: "buyer" },
    { conversation_id: conversation.id, farm_id: listing.seller_farm_id, role: "seller" }
  ]);

  await supabase.from("conversation_messages").insert({
    conversation_id: conversation.id,
    sender_user_id: user.id,
    body: firstMessage
  });

  await supabase.from("app_notifications").insert({
    farm_id: listing.seller_farm_id,
    title: "New marketplace message",
    body: `A buyer sent a message about ${listing.title}.`,
    type: "message",
    link_url: `/account/messages?conversation=${conversation.id}`
  });

  revalidatePath("/account/messages");
  go(`/account/messages?conversation=${conversation.id}`);
}

export async function sendConversationMessage(formData: FormData) {
  const supabase = await createClient();
  const conversationId = text(formData, "conversationId");
  const body = text(formData, "body");
  const senderFarmId = text(formData, "senderFarmId");
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !conversationId || !body) {
    go("/account/messages");
  }

  const { error } = await supabase.from("conversation_messages").insert({
    conversation_id: conversationId,
    sender_user_id: user.id,
    sender_farm_id: senderFarmId,
    body
  });

  if (error) {
    go(`/account/messages?conversation=${conversationId}&message=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  revalidatePath("/account/messages");
  go(`/account/messages?conversation=${conversationId}`);
}

export async function createSupportTicket(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm().catch(() => null);
  const subject = text(formData, "subject");
  const description = text(formData, "description");
  const category = text(formData, "category") ?? "support";
  const priority = text(formData, "priority") ?? "normal";
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go(`/login?next=${encodeURIComponent("/account/support/report-problem")}&message=${encodeURIComponent("Sign in to create a support ticket.")}`);
  }

  if (!subject || !description) {
    go(`/account/support/report-problem?message=${encodeURIComponent("Add a subject and description.")}`);
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      created_by: user.id,
      farm_id: farm?.id ?? null,
      category,
      subject,
      description,
      priority
    })
    .select("id, ticket_number")
    .single();

  if (error || !ticket) {
    go(`/account/support/report-problem?message=${encodeURIComponent(error?.message ?? "Could not create ticket.")}`);
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      type: "support",
      subject,
      support_ticket_id: ticket.id,
      created_by: user.id
    })
    .select("id")
    .single();

  if (conversation) {
    await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: user.id, role: "member" }
    ]);
    await supabase.from("conversation_messages").insert({
      conversation_id: conversation.id,
      sender_user_id: user.id,
      body: description
    });
  }

  await supabase.from("app_notifications").insert({
    title: "New support ticket",
    body: `${ticket.ticket_number}: ${subject}`,
    type: "support",
    link_url: `/admin/support`
  });

  revalidatePath("/account/support");
  revalidatePath("/admin/support");
  go(`/account/support/report-problem?message=${encodeURIComponent(`Ticket ${ticket.ticket_number} created. Admin has been notified.`)}`);
}

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient();
  const notificationId = text(formData, "notificationId");

  if (!notificationId) {
    go("/account/notifications");
  }

  await supabase.from("app_notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
  revalidatePath("/account/notifications");
  revalidatePath("/account");
  go("/account/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();

  await supabase.from("app_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/account/notifications");
  revalidatePath("/account");
  go("/account/notifications");
}
