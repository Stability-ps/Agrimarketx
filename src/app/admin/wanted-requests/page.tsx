import { AdminNav } from "@/components/AdminNav";
import { AppShell, PageHeader } from "@/components/AppShell";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";
import { updateBuyerRequestStatus } from "../actions";

export default async function AdminWantedRequestsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("buyer_requests")
    .select("id, title, category, description, province, town, quantity, budget, status, admin_note, created_at, profiles:buyer_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Wanted Requests" description="Review buyer requests before they appear publicly." />
      <AdminNav />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}
      <div className="grid gap-3">
        {(requests ?? []).length === 0 ? <section className="panel p-5 text-sm text-slate-600">No buyer requests yet.</section> : null}
        {(requests ?? []).map((request) => {
          const buyer = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
          return (
            <section key={request.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">{supplyCategoryLabel(request.category)}</p>
                  <h3 className="mt-1 font-bold">{request.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">Buyer: {buyer?.full_name || buyer?.email || "User"}</p>
                  <p className="mt-1 text-sm text-slate-600">{[request.town, request.province, request.quantity, request.budget].filter(Boolean).join(" · ")}</p>
                  {request.description ? <p className="mt-2 text-sm text-slate-600">{request.description}</p> : null}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{String(request.status).replace("_", " ")}</span>
              </div>
              <form action={updateBuyerRequestStatus} className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_140px]">
                <input type="hidden" name="requestId" value={request.id} />
                <input className="field" name="adminNote" placeholder="Admin note or rejection reason" defaultValue={request.admin_note ?? ""} />
                <select className="field" name="status" defaultValue={request.status}>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="removed">Removed</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="primary-button" type="submit">Save</button>
              </form>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
