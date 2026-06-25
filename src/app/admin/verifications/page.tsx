import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";
import { updateSellerVerification } from "../actions";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, owner_name, owner_phone, location, province, country, logo_url, seller_verification_status, seller_verification_reason")
    .limit(80);

  return (
    <AppShell>
      <PageHeader title="Verifications" description="Approve, reject or suspend seller verification for marketplace trust badges." />
      <AdminNav />
      <div className="grid gap-3 lg:grid-cols-2">
        {(farms ?? []).map((farm) => (
          <section key={farm.id} className="panel p-4">
            <h3 className="font-bold">{farm.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "No location"}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">Status: {String(farm.seller_verification_status ?? "not_started").replace("_", " ")}</p>
            {farm.seller_verification_reason ? <p className="mt-2 rounded-md bg-amber-50 p-2 text-sm font-semibold text-amber-900">{farm.seller_verification_reason}</p> : null}
            <div className="mt-3 grid gap-2 text-sm">
              <div className="rounded-md bg-green-50 p-2 text-green-900">Email verification: ready</div>
              <div className="rounded-md bg-green-50 p-2 text-green-900">Mobile verification: {farm.owner_phone ? "ready" : "needs phone"}</div>
              <div className="rounded-md bg-slate-50 p-2 text-slate-700">ID verification: admin review</div>
            </div>
            <form action={updateSellerVerification} className="mt-3 grid gap-2">
              <input type="hidden" name="farmId" value={farm.id} />
              <select className="field" name="status" defaultValue={farm.seller_verification_status ?? "not_started"}>
                <option value="not_started">Not Started</option>
                <option value="pending_review">Pending Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <input className="field" name="reason" placeholder="Reason, if rejected or suspended" defaultValue={farm.seller_verification_reason ?? ""} />
              <button className="primary-button" type="submit">Save verification</button>
            </form>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
