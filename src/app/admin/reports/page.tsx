import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { formatRand } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { removeReportedListing, updateDisputeStatus } from "../actions";

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("disputes")
    .select("id, status, summary, admin_notes, created_at, marketplace_listings(id, title, price, currency)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Reported Ads" description="Review marketplace reports and keep the community safe." />
      <AdminNav />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <div className="grid gap-3">
        {(reports ?? []).map((report) => {
          const listing = Array.isArray(report.marketplace_listings) ? report.marketplace_listings[0] : report.marketplace_listings;
          return (
            <section key={report.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{report.summary}</h3>
                  <p className="mt-1 text-sm text-slate-600">{listing?.title ?? "Listing"} {listing?.price ? `· ${formatRand(listing.price)}` : ""}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Status: {report.status}</p>
                </div>
                <form action={updateDisputeStatus} className="flex gap-2">
                  <input type="hidden" name="disputeId" value={report.id} />
                  <select className="field" name="status" defaultValue={report.status}>
                    <option value="open">Open</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button className="primary-button" type="submit">Save</button>
                </form>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing?.id ? <a href={`/marketplace/${listing.id}`} className="secondary-button">Open listing</a> : null}
                <form action={updateDisputeStatus} className="flex gap-2">
                  <input type="hidden" name="disputeId" value={report.id} />
                  <input type="hidden" name="status" value="closed" />
                  <button className="secondary-button" type="submit">Ignore report</button>
                </form>
              </div>
              {listing?.id ? (
                <form action={removeReportedListing} className="mt-3 grid gap-2">
                  <input type="hidden" name="disputeId" value={report.id} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input className="field" name="adminNote" placeholder="Admin note, optional" defaultValue={report.admin_notes ?? ""} />
                  <button className="secondary-button border-red-200 text-red-700" type="submit">Remove listing</button>
                </form>
              ) : null}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
