import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { publicStorageUrl } from "@/lib/files";
import { formatRand } from "@/lib/format";
import { marketplaceCategories, marketplaceCategoryLabel, marketplaceDetailsForCard, marketplaceSubcategoryLabel, marketplaceSubcategories, normalizeMarketplaceCategory } from "@/lib/marketplace-categories";
import { createClient } from "@/lib/supabase/server";
import { approveMarketplaceListing, rejectMarketplaceListing, removeMarketplaceListing } from "../actions";

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; status?: string; category?: string; subcategory?: string; province?: string }>;
}) {
  const params = await searchParams;
  const { message, status = "normal", subcategory = "", province = "" } = params;
  const category = params.category && params.category !== "all" ? normalizeMarketplaceCategory(params.category) : "all";
  const availableSubcategories = category === "all" ? [] : marketplaceSubcategories(category);
  const supabase = await createClient();
  let listingsQuery = supabase
    .from("marketplace_listings")
    .select(`
      id,
      animal_id,
      seller_farm_id,
      title,
      description,
      price,
      currency,
      province,
      town,
      approximate_location,
      price_negotiable,
      category,
      subcategory,
      listing_details,
      status,
      rejection_reason,
      created_at,
      marketplace_listing_media(storage_path, media_type, is_primary, created_at),
      animals(animal_code, tag_number, breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
      farms:seller_farm_id(name, location, province, country)
    `);

  if (status === "archive") {
    listingsQuery = listingsQuery.in("status", ["rejected", "removed", "suspended"]);
  } else if (status !== "all") {
    listingsQuery = listingsQuery.in("status", ["draft", "under_review", "approved", "published", "active", "paused", "sold", "reserved"]);
  }

  if (category !== "all") {
    listingsQuery = listingsQuery.eq("category", category);
  }

  if (subcategory) {
    listingsQuery = listingsQuery.eq("subcategory", subcategory);
  }

  if (province) {
    listingsQuery = listingsQuery.eq("province", province);
  }

  const { data: listings } = await listingsQuery.order("created_at", { ascending: false }).limit(80);

  return (
    <AppShell>
      <PageHeader title="Marketplace Listings" description="Review, approve, reject and monitor marketplace ads before they go live." />
      <AdminNav />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <form className="mb-4 grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-5">
        <select className="field" name="status" defaultValue={status}>
          <option value="normal">Normal listings</option>
          <option value="all">All listings</option>
          <option value="archive">Archive listings</option>
        </select>
        <select className="field" name="category" defaultValue={category}>
          <option value="all">All categories</option>
          {marketplaceCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="field" name="subcategory" defaultValue={subcategory} disabled={category === "all"}>
          <option value="">{category === "all" ? "Choose category first" : "All subcategories"}</option>
          {availableSubcategories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
        </select>
        <input className="field" name="province" defaultValue={province} placeholder="Province" />
        <button className="primary-button" type="submit">Filter</button>
      </form>
      <div className="grid gap-4">
        {(listings ?? []).map((listing) => {
          const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
          const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
          const farm = Array.isArray(listing.farms) ? listing.farms[0] : listing.farms;
          const details = marketplaceDetailsForCard(listing.listing_details as Record<string, unknown>);
          const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
          const photos = Array.isArray(animal?.animal_media)
            ? animal.animal_media
                .filter((item) => item.media_type === "photo")
                .sort((a, b) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
            : [];
          const photo = listingMedia.find((item) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item) => item.media_type === "photo") ?? photos[0];
          const photoBucket = listingMedia.includes(photo as never) ? "farm-assets" : "animal-media";

          return (
            <section key={listing.id} className="panel overflow-hidden">
              <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr_auto]">
                {photo?.storage_path ? (
                  <img src={publicStorageUrl(photoBucket, photo.storage_path)} alt={listing.title} className="h-36 w-full rounded-md object-cover" />
                ) : (
                  <div className="grid h-36 rounded-md bg-green-50 text-sm font-semibold text-brand-green place-items-center">No photo</div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{listing.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{String(listing.status).replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {marketplaceCategoryLabel(listing.category)}
                    {marketplaceSubcategoryLabel(listing.category, listing.subcategory) ? ` · ${marketplaceSubcategoryLabel(listing.category, listing.subcategory)}` : ""}
                    {species?.name ? ` · ${species.name}` : ""}
                    {animal?.breed ? ` · ${animal.breed}` : ""}
                    {animal?.gender ? ` · ${animal.gender}` : ""}
                  </p>
                  {details.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {details.map(([label, value]) => (
                        <span key={label} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{label}: {value}</span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-600">Seller farm: {farm?.name ?? "Unknown farm"}</p>
                  <p className="mt-1 text-sm text-slate-600">Location: {listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "Not set"}</p>
                  <p className="mt-2 text-xl font-bold text-brand-green">{formatRand(listing.price)}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{listing.price_negotiable ? "Negotiable" : "Fixed price"}</p>
                  {listing.description ? <p className="mt-2 text-sm text-slate-600">{listing.description}</p> : null}
                  {listing.rejection_reason ? <p className="mt-2 rounded-md bg-red-50 p-2 text-sm font-semibold text-red-700">Rejected: {listing.rejection_reason}</p> : null}
                </div>
                <div className="grid content-start gap-2">
                  {listing.status === "under_review" || listing.status === "rejected" || listing.status === "draft" ? (
                    <form action={approveMarketplaceListing}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <button className="primary-button w-full" type="submit">Approve</button>
                    </form>
                  ) : null}
                  {listing.status !== "rejected" && listing.status !== "sold" ? (
                    <form action={rejectMarketplaceListing} className="grid gap-2">
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input className="field" name="reason" placeholder="Rejection reason" />
                      <button className="secondary-button border-red-200 text-red-700 hover:border-red-300 hover:text-red-800" type="submit">Reject</button>
                    </form>
                  ) : null}
                  {listing.status !== "removed" ? (
                    <form action={removeMarketplaceListing} className="grid gap-2">
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input className="field" name="reason" placeholder="Remove reason" />
                      <button className="secondary-button border-red-200 text-red-700 hover:border-red-300 hover:text-red-800" type="submit">Remove</button>
                    </form>
                  ) : null}
                  {listing.animal_id ? <Link href={`/animals/${listing.animal_id}` as never} className="secondary-button">Open animal</Link> : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
