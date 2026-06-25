import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: totalListings },
    { count: pendingListings },
    { count: activeListings },
    { count: soldListings },
    { count: reportedListings },
    { count: totalUsers },
    { count: buyers },
    { count: sellers },
    { count: verifiedFarms },
    { count: pendingWanted },
    { count: approvedWanted },
    { count: matchedWanted },
    { count: closedWanted },
    { count: pendingTransfers },
    { count: completedTransfers },
    { count: cancelledTransfers },
    { count: openSupport },
    { count: unreadMessages },
    { count: activeSubscriptions }
  ] =
    await Promise.all([
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "under_review"),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
      supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_role", "buyer"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_role", "seller"),
      supabase.from("farms").select("id", { count: "exact", head: true }).eq("seller_verification_status", "verified"),
      supabase.from("buyer_requests").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      supabase.from("buyer_requests").select("id", { count: "exact", head: true }).in("status", ["approved", "published"]),
      supabase.from("buyer_requests").select("id", { count: "exact", head: true }).eq("status", "matched"),
      supabase.from("buyer_requests").select("id", { count: "exact", head: true }).eq("status", "closed"),
      supabase.from("ownership_transfers").select("id", { count: "exact", head: true }).in("status", ["pending", "seller_ready", "awaiting_collection", "in_transit"]),
      supabase.from("ownership_transfers").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("ownership_transfers").select("id", { count: "exact", head: true }).in("status", ["cancelled", "failed"]),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("conversation_messages").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")
    ]);

  const kpiGroups = [
    {
      title: "Marketplace",
      href: "/admin/listings",
      cards: [
        ["Total Listings", totalListings],
        ["Pending Listings", pendingListings],
        ["Active Listings", activeListings],
        ["Sold Listings", soldListings],
        ["Reported Listings", reportedListings]
      ]
    },
    {
      title: "Users",
      href: "/admin/users",
      cards: [
        ["Total Users", totalUsers],
        ["Buyers", buyers],
        ["Farmers/Sellers", sellers],
        ["Verified Farmers", verifiedFarms],
        ["Suspended Users", 0]
      ]
    },
    {
      title: "Wanted Requests",
      href: "/admin/wanted-requests",
      cards: [
        ["Pending Wanted Requests", pendingWanted],
        ["Approved Wanted Requests", approvedWanted],
        ["Matched Requests", matchedWanted],
        ["Closed Requests", closedWanted]
      ]
    },
    {
      title: "Transfers",
      href: "/admin/transfers",
      cards: [
        ["Pending Ownership Transfers", pendingTransfers],
        ["Completed Transfers", completedTransfers],
        ["Failed/Cancelled Transfers", cancelledTransfers]
      ]
    },
    {
      title: "Support",
      href: "/admin/support",
      cards: [
        ["Open Support Tickets", openSupport],
        ["Unread Messages", unreadMessages],
        ["Reported Conversations", 0]
      ]
    },
    {
      title: "Subscriptions",
      href: "/admin/subscriptions",
      cards: [
        ["Active Subscriptions", activeSubscriptions],
        ["Trial Accounts", 0],
        ["Expired Subscriptions", 0],
        ["Monthly Revenue", "R0"]
      ]
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Admin Dashboard"
        description="Platform operations dashboard for marketplace moderation, users, requests, transfers, support and subscriptions."
      />
      <AdminNav />
      <div className="mb-5 flex flex-wrap gap-2">
        {["Today", "This Week", "This Month", "All Time"].map((filter) => (
          <button key={filter} className={`rounded-md border px-3 py-2 text-sm font-bold ${filter === "All Time" ? "border-brand-green bg-green-50 text-brand-green" : "border-slate-200 text-slate-600"}`} type="button">
            {filter}
          </button>
        ))}
      </div>
      <div className="grid gap-5">
        {kpiGroups.map((group) => (
          <section key={group.title} className="panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-bold text-brand-navy">{group.title}</h3>
              <Link href={group.href as never} className="text-sm font-bold text-brand-green">Open</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {group.cards.map(([title, value]) => (
                <div key={title} className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
                  <p className="mt-2 text-2xl font-bold text-brand-green">{typeof value === "number" ? value.toLocaleString("en-ZA") : value ?? 0}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
