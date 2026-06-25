import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { formatRand } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: savedListings } = await supabase
    .from("marketplace_saved_listings")
    .select("id, marketplace_listings(id, title, price, currency, approximate_location, town, province)")
    .eq("user_id", user?.id ?? "")
    .limit(50);
  const { data: followedFarms } = await supabase
    .from("farm_followers")
    .select("id, farms(id, name, location, province, country, logo_url, seller_verification_status)")
    .eq("user_id", user?.id ?? "")
    .limit(50);

  return (
    <AppShell>
      <PageHeader title="Saved" description="Your favourite listings and followed farms." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h3 className="font-bold">Saved Listings</h3>
          <div className="mt-4 grid gap-2">
            {(savedListings ?? []).length === 0 ? <p className="text-sm text-slate-500">No saved listings yet.</p> : null}
            {(savedListings ?? []).map((item) => {
              const listing = Array.isArray(item.marketplace_listings) ? item.marketplace_listings[0] : item.marketplace_listings;
              if (!listing) return null;
              return (
                <Link key={item.id} href={`/marketplace/${listing.id}` as never} className="rounded-md border border-slate-200 p-3 hover:border-brand-green">
                  <p className="font-bold">{listing.title}</p>
                  <p className="text-sm text-slate-600">{listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "No location"}</p>
                  <p className="mt-1 font-bold text-brand-green">{formatRand(listing.price)}</p>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="panel p-5">
          <h3 className="font-bold">Saved Farms</h3>
          <div className="mt-4 grid gap-2">
            {(followedFarms ?? []).length === 0 ? <p className="text-sm text-slate-500">No followed farms yet.</p> : null}
            {(followedFarms ?? []).map((item) => {
              const farm = Array.isArray(item.farms) ? item.farms[0] : item.farms;
              if (!farm) return null;
              return (
                <Link key={item.id} href={`/farms/${farm.id}` as never} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:border-brand-green">
                  {farm.logo_url ? (
                    <img src={farm.logo_url} alt={farm.name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-green-50 text-xs font-bold text-brand-green">Farm</div>
                  )}
                  <span>
                    <span className="block font-bold">{farm.name}</span>
                    <span className="text-sm text-slate-600">{farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "No location"}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
