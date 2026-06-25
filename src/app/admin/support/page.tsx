import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";
import { updateSupportTicket } from "./actions";

export default async function AdminSupportPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, description, category, priority, status, admin_note, created_at, profiles:created_by(full_name, email), farms(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Support Tickets" description="View support requests and update their status." />
      <AdminNav />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <div className="grid gap-3">
        {(tickets ?? []).length === 0 ? <section className="panel p-5 text-sm text-slate-600">No support tickets yet.</section> : null}
        {(tickets ?? []).map((ticket) => {
          const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
          const farm = Array.isArray(ticket.farms) ? ticket.farms[0] : ticket.farms;
          return (
            <section key={ticket.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{ticket.ticket_number} · {ticket.subject}</h3>
                  <p className="mt-1 text-sm text-slate-600">{ticket.category} · {ticket.priority} · {ticket.status}</p>
                  <p className="mt-1 text-sm text-slate-600">From: {profile?.full_name || profile?.email || "User"}{farm?.name ? ` · ${farm.name}` : ""}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
                </div>
              </div>
              <form action={updateSupportTicket} className="mt-4 grid gap-2 md:grid-cols-[180px_1fr_auto]">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <select className="field" name="status" defaultValue={ticket.status}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <input className="field" name="adminNote" placeholder="Admin note" defaultValue={ticket.admin_note ?? ""} />
                <button className="primary-button" type="submit">Save</button>
              </form>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
