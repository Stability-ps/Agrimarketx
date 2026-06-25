import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";

export default async function MyRequestsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: requests } = await supabase
    .from("buyer_requests")
    .select("id, title, category, province, town, quantity, budget, status, admin_note, created_at, buyer_request_responses(id, message, quote_amount, available_quantity, delivery_option, contact_preference, farms:seller_farm_id(name))")
    .eq("buyer_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(80);

  return (
    <AppShell>
      <PageHeader
        title="My Requests"
        description="Track buyer requests, review status and seller responses."
        action={<Link href="/marketplace/wanted" className="primary-button">Tell us what you need</Link>}
      />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}
      <div className="grid gap-4">
        {(requests ?? []).length === 0 ? (
          <section className="panel p-5 text-center">
            <h3 className="font-bold">No requests yet</h3>
            <p className="mt-1 text-sm text-slate-600">Create a buyer request and sellers can respond after admin approval.</p>
            <Link href="/marketplace/wanted" className="primary-button mt-4 inline-flex">Create request</Link>
          </section>
        ) : null}
        {(requests ?? []).map((request) => (
          <section key={request.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{supplyCategoryLabel(request.category)}</p>
                <h3 className="mt-1 font-bold">{request.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{[request.town, request.province].filter(Boolean).join(", ") || "South Africa"}</p>
                <p className="mt-2 text-sm text-slate-600">{[request.quantity, request.budget].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">{String(request.status).replace("_", " ")}</span>
            </div>
            {request.admin_note ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">{request.admin_note}</p> : null}
            <div className="mt-4">
              <h4 className="font-bold">Seller responses</h4>
              {(request.buyer_request_responses ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No seller responses yet.</p>
              ) : null}
              <div className="mt-2 grid gap-2">
                {(request.buyer_request_responses ?? []).map((response: any) => {
                  const farm = Array.isArray(response.farms) ? response.farms[0] : response.farms;
                  return (
                    <div key={response.id} className="rounded-md border border-slate-200 p-3">
                      <p className="font-bold">{farm?.name ?? "Seller"}</p>
                      <p className="mt-1 text-sm text-slate-600">{response.message}</p>
                      <p className="mt-2 text-sm font-semibold text-brand-green">
                        {response.quote_amount ? `ZAR ${Number(response.quote_amount).toLocaleString("en-ZA")}` : "Quote not set"}
                        {response.available_quantity ? ` · ${response.available_quantity}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
