import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";

export default async function FarmsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email, account_role, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, logo_url, photo_url, location, province, country, description, supply_categories, seller_verification_status, marketplace_listings(id, status)")
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <MarketplacePageShell>
      <section className="mb-5">
        <h1 className="text-2xl font-bold text-brand-navy">Farms on AgriMarketX</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Browse public farm profiles, verified sellers and active farm listings across South Africa.</p>
      </section>

      {(farms ?? []).length === 0 ? (
        <section className="panel p-6 text-center">
          <h2 className="font-bold">No public farms yet</h2>
          <p className="mt-1 text-sm text-slate-600">Verified farms and public seller profiles will appear here.</p>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(farms ?? []).map((farm) => {
          const activeCount = Array.isArray(farm.marketplace_listings)
            ? farm.marketplace_listings.filter((listing: any) => listing.status === "active").length
            : 0;
          const location = farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "South Africa";
          const verified = farm.seller_verification_status === "verified";

          return (
            <Link key={farm.id} href={`/farms/${farm.id}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
              {farm.photo_url ? (
                <img src={farm.photo_url} alt={farm.name} className="h-36 w-full object-cover" />
              ) : (
                <div className="grid h-36 place-items-center bg-green-50 text-sm font-bold text-brand-green">Farm profile</div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {farm.logo_url ? (
                    <img src={farm.logo_url} alt={farm.name} className="-mt-10 h-16 w-16 rounded-full border-4 border-white object-cover" />
                  ) : (
                    <div className="-mt-10 grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-white bg-green-50 text-xs font-bold text-brand-green">Farm</div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-bold text-brand-navy">{farm.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} /> {location}</p>
                  </div>
                </div>
                {farm.description ? <p className="mt-3 line-clamp-2 text-sm text-slate-600">{farm.description}</p> : null}
                {(farm.supply_categories ?? []).length > 0 ? (
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500">
                    {((farm.supply_categories ?? []) as string[]).slice(0, 4).map((item) => supplyCategoryLabel(item)).join(" • ")}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  {verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-brand-green"><ShieldCheck size={14} /> Verified</span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{activeCount} active listings</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </MarketplacePageShell>
  );
}
