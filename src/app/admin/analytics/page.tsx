import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-green">{(value ?? 0).toLocaleString("en-ZA")}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const [
    { count: users },
    { count: farms },
    { count: activeListings },
    { count: soldListings },
    { count: wantedRequests },
    { count: conversations },
    { count: messages },
    { count: completedTransfers }
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("farms").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("buyer_requests").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("conversation_messages").select("id", { count: "exact", head: true }),
    supabase.from("ownership_transfers").select("id", { count: "exact", head: true }).eq("status", "completed")
  ]);

  return (
    <AppShell>
      <PageHeader title="Analytics" description="Current platform activity from live AgriMarketX records." />
      <AdminNav />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Users" value={users} />
        <Metric label="Farms" value={farms} />
        <Metric label="Active listings" value={activeListings} />
        <Metric label="Sold listings" value={soldListings} />
        <Metric label="Wanted requests" value={wantedRequests} />
        <Metric label="Conversations" value={conversations} />
        <Metric label="Messages" value={messages} />
        <Metric label="Completed transfers" value={completedTransfers} />
      </div>
      <section className="panel mt-5 p-5">
        <h2 className="font-bold text-brand-navy">Operational detail</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use the moderation and operations pages for searchable records, status changes and case-level actions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/listings" className="secondary-button">Listings</Link>
          <Link href="/admin/users" className="secondary-button">Users</Link>
          <Link href="/admin/verifications" className="secondary-button">Verifications</Link>
          <Link href="/admin/transfers" className="secondary-button">Transfers</Link>
        </div>
      </section>
    </AppShell>
  );
}
