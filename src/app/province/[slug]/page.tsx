import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { LocationListingCard } from "@/components/LocationListingCard";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { cityDirectory, provinceBySlug, provinceDirectory } from "@/lib/provinces";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return provinceDirectory.map((province) => ({ slug: province.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const province = provinceBySlug(slug);
  const title = province ? `${province.name} Agricultural Marketplace | AgriMarketX` : "Province Marketplace | AgriMarketX";
  const description = province
    ? `Browse livestock, feed, crops, equipment, vehicles, infrastructure, services and farm products in ${province.name}.`
    : "Browse agricultural marketplace listings by province on AgriMarketX.";

  return { title, description };
}

function seoDescription(provinceName: string) {
  return `Browse livestock, farm produce, feed, equipment, vehicles, infrastructure and agricultural services from sellers in ${provinceName}. Find verified farms, suppliers, machinery and local agricultural products near you.`;
}

export default async function ProvincePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const province = provinceBySlug(slug);
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

  if (!province) {
    return (
      <MarketplacePageShell accountRole={profile?.account_role ?? "buyer"} userEmail={user?.email ?? profile?.email} userName={profile?.full_name} avatarUrl={profile?.avatar_url}>
        <PageHeader title="Province not found" description="This province page is not available." />
      </MarketplacePageShell>
    );
  }

  const listingSelect = `
    id,
    title,
    price,
    currency,
    province,
    town,
    approximate_location,
    category,
    animals(breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
    marketplace_listing_media(storage_path, media_type, is_primary, created_at)
  `;
  const { data: livestockListings } = await supabase
    .from("marketplace_listings")
    .select(listingSelect)
    .eq("status", "active")
    .eq("category", "livestock")
    .ilike("province", province.name)
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: productListings } = await supabase
    .from("marketplace_listings")
    .select(listingSelect)
    .eq("status", "active")
    .neq("category", "livestock")
    .ilike("province", province.name)
    .order("created_at", { ascending: false })
    .limit(12);
  const { data: farms } = await supabase
    .from("farms")
    .select("id, name, logo_url, location, province, country, seller_verification_status")
    .ilike("province", province.name)
    .order("name", { ascending: true })
    .limit(18);
  const provinceCities = cityDirectory().filter((city) => city.provinceSlug === province.slug);
  const featuredListings = [...(livestockListings ?? []), ...(productListings ?? [])].slice(0, 4);
  const content = (
    <>
      <PageHeader
        title={`${province.name} Marketplace`}
        description={seoDescription(province.name)}
        action={<Link href="/marketplace" className="secondary-button">Browse all listings</Link>}
      />

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-brand-navy">Cities and towns in {province.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {provinceCities.map((city) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}` as never}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-brand-green hover:text-brand-green"
            >
              {city.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="font-bold text-brand-navy">Featured listings in {province.name}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featuredListings.length === 0 ? <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-500">No featured listings in this province yet.</p> : null}
          {featuredListings.map((listing) => <LocationListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="font-bold text-brand-navy">Livestock and animal listings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(livestockListings ?? []).length === 0 ? <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-500">No livestock or animal listings in this province yet.</p> : null}
          {(livestockListings ?? []).map((listing) => <LocationListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="font-bold text-brand-navy">Product listings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(productListings ?? []).length === 0 ? <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-500">No product listings in this province yet.</p> : null}
          {(productListings ?? []).map((listing) => <LocationListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="font-bold text-brand-navy">Farms in {province.name}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(farms ?? []).length === 0 ? <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-500">No public farms found in this province yet.</p> : null}
          {(farms ?? []).map((farm) => {
            const location = farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || province.name;
            return (
              <Link key={farm.id} href={`/farms/${farm.id}` as never} className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-brand-green">
                <div className="flex items-start gap-3">
                  {farm.logo_url ? (
                    <img src={farm.logo_url} alt={farm.name} className="h-14 w-14 rounded-md object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-green-50 text-xs font-bold text-brand-green">Farm</div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-brand-navy">{farm.name}</p>
                      {farm.seller_verification_status === "verified" ? <ShieldCheck className="text-brand-green" size={16} /> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{location}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-md border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-brand-navy">Related categories</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Livestock", "Feed & Inputs", "Crops / Produce", "Farm Equipment", "Vehicles", "Agri Services"].map((label) => (
            <Link key={label} href={`/marketplace?q=${encodeURIComponent(label)}` as never} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-brand-green hover:text-brand-green">
              {label}
            </Link>
          ))}
        </div>
        <Link href="/marketplace" className="secondary-button mt-4">Browse All South Africa Listings</Link>
      </section>

      <div className="mt-5 text-sm text-slate-600">
        <Link href="/marketplace" className="font-bold text-brand-green">AgriMarketX Marketplace</Link>
        <span> / {province.name}</span>
        <span> / {province.towns.slice(0, 4).map((town) => town).join(" • ")}</span>
      </div>
    </>
  );

  return (
    <MarketplacePageShell accountRole={profile?.account_role ?? "buyer"} userEmail={user?.email ?? profile?.email} userName={profile?.full_name} avatarUrl={profile?.avatar_url}>
      {content}
    </MarketplacePageShell>
  );
}
