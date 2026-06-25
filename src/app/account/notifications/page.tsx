import Link from "next/link";
import { Bell, CheckCircle2, HeartPulse, MessageCircle, ShieldCheck, ShoppingCart, UserPlus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "@/app/account/messages/actions";

function notificationIcon(type: string | null) {
  if (type === "message") {
    return MessageCircle;
  }
  if (type === "marketplace" || type === "listing") {
    return ShoppingCart;
  }
  if (type === "verification") {
    return ShieldCheck;
  }
  if (type === "follow") {
    return UserPlus;
  }
  if (type === "health" || type === "breeding") {
    return HeartPulse;
  }
  return Bell;
}

function shortDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("app_notifications")
    .select("id, title, body, type, link_url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(80);
  const unreadCount = (notifications ?? []).filter((item) => !item.read_at).length;

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="Important updates for messages, support, listings and farm activity."
        action={unreadCount > 0 ? (
          <form action={markAllNotificationsRead}>
            <button className="secondary-button" type="submit">Mark all as read</button>
          </form>
        ) : null}
      />
      <div className="mx-auto max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white">
        {(notifications ?? []).length === 0 ? (
          <div className="p-5">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-green-50 text-brand-green">
              <Bell size={22} />
            </div>
            <h3 className="mt-4 font-bold">No new notifications</h3>
            <p className="mt-1 text-sm text-slate-600">Health reminders, listing updates, support replies and message alerts will appear here.</p>
          </div>
        ) : null}
        {(notifications ?? []).map((item) => {
          const Icon = item.read_at ? CheckCircle2 : notificationIcon(item.type);

          return (
          <div key={item.id} className={`border-b border-slate-100 p-4 last:border-b-0 ${item.read_at ? "bg-white" : "bg-green-50"}`}>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-brand-green">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold">{item.title}</p>
                  <span className="text-xs text-slate-500">{shortDate(item.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.link_url ? <Link href={item.link_url as never} className="secondary-button">Open</Link> : null}
                  {!item.read_at ? (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <button className="secondary-button" type="submit">Mark read</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </AppShell>
  );
}
