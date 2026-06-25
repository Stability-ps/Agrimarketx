import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOptionalCurrentFarm } from "@/lib/farm-server";

function formatStatus(status?: string | null) {
  return String(status || "draft")
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export default async function AccountTransfersPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Faccount%2Ftransfers");
  }

  const farm = await getOptionalCurrentFarm();
  let query = supabase
    .from("ownership_transfers")
    .select("id, status, delivery_method, created_at, buyer_user_id, seller_farm_id, buyer_farm_id, animals(id, animal_code, tag_number, breed, gender, species(name)), farms:seller_farm_id(name)")
    .order("created_at", { ascending: false })
    .limit(80);

  query = farm?.id
    ? query.or(`buyer_user_id.eq.${user.id},seller_farm_id.eq.${farm.id},buyer_farm_id.eq.${farm.id}`)
    : query.eq("buyer_user_id", user.id);

  const { data: transfers } = await query;

  return (
    <AppShell>
      <PageHeader title="Transfer Centre" description="Track livestock ownership transfers you are buying or selling." />
      <div className="grid gap-3">
        {(transfers ?? []).length === 0 ? (
          <section className="panel p-5">
            <h3 className="font-bold">No transfers yet</h3>
            <p className="mt-1 text-sm text-slate-600">When a marketplace livestock sale starts an ownership transfer, it will appear here.</p>
            <Link href="/marketplace" className="primary-button mt-4 inline-flex">Browse marketplace</Link>
          </section>
        ) : null}

        {(transfers ?? []).map((transfer) => {
          const animal = Array.isArray(transfer.animals) ? transfer.animals[0] : transfer.animals;
          const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
          const sellerFarm = Array.isArray(transfer.farms) ? transfer.farms[0] : transfer.farms;
          const role = transfer.seller_farm_id === farm?.id ? "Selling" : "Buying";

          return (
            <section key={transfer.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{role}</p>
                  <h3 className="mt-1 font-bold">
                    {animal?.animal_code ?? "Livestock transfer"}
                    {animal?.tag_number ? ` · Tag ${animal.tag_number}` : ""}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {[species?.name, animal?.breed, animal?.gender, sellerFarm?.name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">{formatStatus(transfer.status)}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Delivery</p>
                  <p className="mt-1 font-semibold text-brand-navy">{transfer.delivery_method || "Not selected"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Started</p>
                  <p className="mt-1 font-semibold text-brand-navy">{new Date(transfer.created_at).toLocaleDateString("en-ZA")}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Next step</p>
                  <p className="mt-1 font-semibold text-brand-navy">{transfer.status === "seller_ready" ? "Buyer chooses collection or delivery" : "Track status here"}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
