import Link from "next/link";
import { Eye, Heart, MessageCircle, MousePointerClick, Pause, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { publicStorageUrl } from "@/lib/files";
import { formatRand } from "@/lib/format";
import { marketplaceCategoryLabel } from "@/lib/marketplace-categories";
import { createClient } from "@/lib/supabase/server";
import { getOptionalCurrentFarm } from "@/lib/farm-server";
import { updateMyListingStatus } from "../actions";

const tabs = [
  ["all", "All"],
  ["active", "Active"],
  ["under_review", "Pending Review"],
  ["sold", "Sold"],
  ["paused", "Paused"],
  ["rejected", "Rejected"],
  ["removed", "Removed"]
] as const;

export default async function MyListingsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const { status = "all", message } = await searchParams;
  const supabase = await createClient();
  const farm = await getOptionalCurrentFarm();
  let listings: any[] = [];

  if (farm?.id) {
    let query = supabase
      .from("marketplace_listings")
      .select(`
        id,
        animal_id,
        title,
        price,
        currency,
        province,
        town,
        approximate_location,
        status,
        category,
        views_count,
        contact_clicks_count,
        saved_count,
        marketplace_listing_media(storage_path, media_type, is_primary, created_at),
        animals(animal_code, tag_number, animal_media(storage_path, media_type, is_profile, created_at))
      `)
      .eq("seller_farm_id", farm.id);

    if (status === "all") {
      query = query.not("status", "in", "(removed,rejected,suspended)");
    } else {
      query = query.eq("status", status);
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(80);
    listings = data ?? [];
  }

  return (
    <AppShell>
      <PageHeader
        title="My Listings"
        description="Manage your marketplace listings and see simple buyer activity."
        action={<Link href={farm ? "/marketplace/create" : "/account/type"} className="primary-button">{farm ? "Create listing" : "Start selling"}</Link>}
      />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([value, label]) => (
          <Link
            key={value}
            href={`/account/listings?status=${value}` as never}
            className={`min-w-fit rounded-md border px-3 py-2 text-sm font-bold ${status === value ? "border-brand-green bg-green-50 text-brand-green" : "border-slate-200 text-slate-600"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="grid gap-4">
        {!farm ? (
          <section className="panel p-5 text-center">
            <h3 className="font-bold">No seller farm yet</h3>
            <p className="mt-1 text-sm text-slate-600">Buyer accounts can browse, save and message. To create listings, choose Manage my farm / Sell and add your first farm.</p>
            <Link href="/account/type" className="primary-button mt-4 inline-flex">Start selling</Link>
          </section>
        ) : null}
        {farm && (listings ?? []).length === 0 ? (
          <section className="panel p-5 text-center">
            <h3 className="font-bold">No listings here yet</h3>
            <p className="mt-1 text-sm text-slate-600">Create a listing or choose another status tab.</p>
          </section>
        ) : null}
        {(listings ?? []).map((listing) => {
          const listingMedia: any[] = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
          const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
          const animalMedia: any[] = Array.isArray(animal?.animal_media) ? animal.animal_media : [];
          const photo = listingMedia.find((item) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item) => item.media_type === "photo") ?? animalMedia.find((item) => item.media_type === "photo" && item.is_profile) ?? animalMedia.find((item) => item.media_type === "photo");
          const bucket = listingMedia.includes(photo as never) ? "farm-assets" : "animal-media";
          const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "No location";

          return (
            <section key={listing.id} className="panel overflow-hidden">
              <div className="grid gap-4 p-4 sm:grid-cols-[150px_1fr]">
                {photo?.storage_path ? (
                  <img src={publicStorageUrl(bucket, photo.storage_path)} alt={listing.title} className="h-36 w-full rounded-md object-cover" />
                ) : (
                  <div className="grid h-36 place-items-center rounded-md bg-green-50 text-sm font-bold text-brand-green">No photo</div>
                )}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{marketplaceCategoryLabel(listing.category)} · {location}</p>
                      <p className="mt-2 text-xl font-bold text-brand-green">{formatRand(listing.price)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{String(listing.status).replace("_", " ")}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-5">
                    <div className="rounded-md bg-slate-50 p-2"><Eye className="mx-auto" size={16} />{listing.views_count ?? 0}<br />Views</div>
                    <div className="rounded-md bg-slate-50 p-2"><MousePointerClick className="mx-auto" size={16} />{listing.contact_clicks_count ?? 0}<br />Contacts</div>
                    <div className="rounded-md bg-slate-50 p-2"><Heart className="mx-auto" size={16} />{listing.saved_count ?? 0}<br />Saved</div>
                    <div className="rounded-md bg-slate-50 p-2"><MessageCircle className="mx-auto" size={16} />0<br />Chats</div>
                    <div className="rounded-md bg-slate-50 p-2">{listing.animal_id ? "Animal" : "Product"}<br />Type</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.animal_id ? (
                      <Link href={`/animals/${listing.animal_id}?action=listing#marketplace-listing` as never} className="secondary-button"><Pencil size={16} /> Edit</Link>
                    ) : (
                      <Link href="/marketplace/create" className="secondary-button"><Pencil size={16} /> Edit</Link>
                    )}
                    {listing.status !== "paused" && listing.status !== "sold" && listing.status !== "removed" ? (
                      <form action={updateMyListingStatus}>
                        <input type="hidden" name="listingId" value={listing.id} />
                        <input type="hidden" name="status" value="paused" />
                        <button className="secondary-button" type="submit"><Pause size={16} /> Pause</button>
                      </form>
                    ) : null}
                    {listing.status !== "sold" ? (
                      <form action={updateMyListingStatus}>
                        <input type="hidden" name="listingId" value={listing.id} />
                        <input type="hidden" name="status" value="sold" />
                        <button className="secondary-button" type="submit">Mark as Sold</button>
                      </form>
                    ) : null}
                    <form action={updateMyListingStatus}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="status" value="removed" />
                      <button className="secondary-button border-red-200 text-red-700" type="submit"><Trash2 size={16} /> Delete</button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
