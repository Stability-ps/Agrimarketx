import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { sendConversationMessage } from "./actions";

export default async function MessagesPage({
  searchParams
}: {
  searchParams: Promise<{ conversation?: string; message?: string }>;
}) {
  const { conversation: activeConversationId, message } = await searchParams;
  const supabase = await createClient();
  const farm = await getCurrentFarm().catch(() => null);
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, type, subject, status, seller_farm_id, listing_id, updated_at, marketplace_listings(title)")
    .order("updated_at", { ascending: false })
    .limit(50);
  const active = activeConversationId || conversations?.[0]?.id;
  const { data: messages } = active
    ? await supabase
        .from("conversation_messages")
        .select("id, body, sender_user_id, sender_farm_id, created_at, profiles:sender_user_id(full_name, email), farms:sender_farm_id(name)")
        .eq("conversation_id", active)
        .order("created_at", { ascending: true })
    : { data: [] };
  const activeConversation = conversations?.find((item) => item.id === active);
  const activeFarmId = farm?.id ?? "";
  const senderFarmId = activeConversation?.seller_farm_id === activeFarmId ? activeFarmId : "";

  return (
    <AppShell>
      <PageHeader title="Messages" description="Chat with buyers, sellers, support and admin." />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-bold">Chats</h3>
          </div>
          {(conversations ?? []).length === 0 ? (
            <div className="p-4 text-sm text-slate-600">
              No chats yet. Start from a marketplace listing or support ticket.
              <Link href="/marketplace" className="primary-button mt-3 inline-flex">Open marketplace</Link>
            </div>
          ) : null}
          {(conversations ?? []).map((thread) => {
            const listing = Array.isArray(thread.marketplace_listings) ? thread.marketplace_listings[0] : thread.marketplace_listings;
            return (
              <Link
                key={thread.id}
                href={`/account/messages?conversation=${thread.id}` as never}
                className={`block border-b border-slate-100 p-4 last:border-b-0 ${thread.id === active ? "bg-green-50" : "hover:bg-slate-50"}`}
              >
                <p className="font-bold">{thread.subject}</p>
                <p className="mt-1 text-sm text-slate-600">{listing?.title ?? thread.type} · {thread.status}</p>
              </Link>
            );
          })}
        </section>
        <section className="rounded-md border border-slate-200 bg-white">
          {active ? (
            <>
              <div className="border-b border-slate-200 p-4">
                <h3 className="font-bold">{activeConversation?.subject ?? "Conversation"}</h3>
                <p className="mt-1 text-sm text-slate-600">Messages are visible to the people and farms in this conversation.</p>
              </div>
              <div className="grid max-h-[520px] gap-3 overflow-y-auto p-4">
                {(messages ?? []).map((item) => {
                  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                  const senderFarm = Array.isArray(item.farms) ? item.farms[0] : item.farms;
                  const mine = item.sender_user_id === user?.id || item.sender_farm_id === farm?.id;
                  return (
                    <div key={item.id} className={`max-w-[85%] rounded-md p-3 text-sm ${mine ? "ml-auto bg-brand-green text-white" : "bg-slate-100 text-slate-800"}`}>
                      <p className="text-xs font-bold opacity-80">{senderFarm?.name || profile?.full_name || profile?.email || "AgriMarketX user"}</p>
                      <p className="mt-1 whitespace-pre-wrap">{item.body}</p>
                    </div>
                  );
                })}
              </div>
              <form action={sendConversationMessage} className="border-t border-slate-200 p-4">
                <input type="hidden" name="conversationId" value={active} />
                <input type="hidden" name="senderFarmId" value={senderFarmId} />
                <textarea className="field min-h-24" name="body" placeholder="Type your message" required />
                <button className="primary-button mt-3 w-full sm:w-fit" type="submit">Send message</button>
              </form>
            </>
          ) : (
            <div className="p-5">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-green-50 text-brand-green">
                <MessageCircle size={22} />
              </div>
              <h3 className="mt-4 font-bold">No message thread selected</h3>
              <p className="mt-1 text-sm text-slate-600">Start a chat from a marketplace listing or support ticket.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
