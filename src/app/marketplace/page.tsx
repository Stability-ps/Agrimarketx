import Link from "next/link";
import {
  Car,
  Heart,
  Home,
  LifeBuoy,
  MapPin,
  MoreHorizontal,
  Package,
  PawPrint,
  ShieldCheck,
  ShoppingCart,
  Tractor,
  Truck,
  Users,
  Warehouse,
  Wheat,
  Wrench
} from "lucide-react";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { MarketplaceShareButton } from "@/components/MarketplaceShareButton";
import { MoreCategoriesMenu } from "@/components/MoreCategoriesMenu";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import {
  marketplaceCategories,
  marketplaceCategoryLabel,
  marketplaceCategoryTree,
  marketplaceCategoryUrl,
  expandMarketplaceSearchTerms,
  marketplaceSubcategoryLabel,
  marketplaceSubcategories,
  normalizeMarketplaceCategory
} from "@/lib/marketplace-categories";
import { provinceDirectory, provincePreview } from "@/lib/provinces";
import { createClient } from "@/lib/supabase/server";
import { toggleSavedListing } from "./actions";

const categoryShortcuts = [
  { label: "Livestock", href: "/marketplace?category=livestock", icon: PawPrint },
  { label: "Livestock Herds", href: "/marketplace?category=livestock_herds", icon: Users },
  { label: "Feed & Inputs", href: "/marketplace?category=feed_inputs", icon: Package },
  { label: "Crops / Produce", href: "/marketplace?category=crops_produce", icon: Wheat },
  { label: "Farm Equipment", href: "/marketplace?category=farm_equipment", icon: Tractor },
  { label: "Vehicles", href: "/marketplace?category=vehicles", icon: Car },
  { label: "Infrastructure", href: "/marketplace?category=infrastructure", icon: Warehouse },
  { label: "Agri Services", href: "/marketplace?category=agri_services", icon: Wrench },
  { label: "More Categories", href: "/marketplace?category=all", icon: MoreHorizontal }
];

const wantedListings = [
  { title: "Looking for 20 Boer Does", location: "Eastern Cape", budget: "R2 500 - R3 000 / head", quantity: "20 does", icon: Users },
  { title: "Need Lucerne Bales", location: "Free State", budget: "Open to bulk price", quantity: "100+ bales", icon: Package },
  { title: "Looking for Dorper Ram", location: "KwaZulu-Natal", budget: "R6 000 - R8 000", quantity: "1 ram", icon: PawPrint },
  { title: "Need Second Hand Tractor", location: "Mpumalanga", budget: "80 - 120 HP", quantity: "1 tractor", icon: Tractor }
];

const showMarketplaceStats = false;

function detailValue(details: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!details) {
    return null;
  }

  for (const key of keys) {
    const value = details[key];
    if (String(value ?? "").trim()) {
      return String(value);
    }
  }

  return null;
}

function listingSearchText(listing: any) {
  const details = listing.listing_details as Record<string, unknown> | null | undefined;
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const species = Array.isArray(animal?.species) ? animal.species[0] : animal?.species;

  return [
    listing.title,
    listing.description,
    listing.category,
    marketplaceCategoryLabel(listing.category),
    listing.subcategory,
    marketplaceSubcategoryLabel(listing.category, listing.subcategory),
    listing.province,
    listing.town,
    listing.approximate_location,
    animal?.breed,
    animal?.gender,
    species?.name,
    ...(details ? Object.values(details) : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchMatchesListing(listing: any, query: string) {
  const terms = expandMarketplaceSearchTerms(query)
    .map((term) => term.toLowerCase().trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = listingSearchText(listing);
  return terms.some((term) => haystack.includes(term));
}

function listingCountKey(category: string | null | undefined, subcategory?: string | null) {
  return `${category ?? ""}::${subcategory ?? ""}`;
}

function quickInfoForListing(listing: any) {
  const details = listing.listing_details as Record<string, unknown> | null | undefined;
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const category = normalizeMarketplaceCategory(listing.category);

  if (category === "livestock") {
    return [
      ["Gender", animal?.gender],
      ["Age", detailValue(details, ["age"])],
      ["Weight", detailValue(details, ["weight"]) || (animal?.weight ? `${animal.weight} kg` : null)]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "livestock_herds") {
    return [
      ["Breakdown", detailValue(details, ["countBreakdown", "quantity"])],
      ["Age", detailValue(details, ["ageRange", "age"])],
      ["Per Head", detailValue(details, ["pricePerHead"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "vehicles") {
    return [
      ["Year/Model", detailValue(details, ["model"])],
      ["Mileage", detailValue(details, ["kilometres"])],
      ["Transmission", detailValue(details, ["transmission"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "farm_equipment") {
    return [
      ["Year/Model", detailValue(details, ["model"])],
      ["Hours", detailValue(details, ["hoursUsed"])],
      ["Power", detailValue(details, ["horsepower", "power"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "feed_inputs") {
    return [
      ["Bag Size", detailValue(details, ["weightPerUnit"])],
      ["Quantity", detailValue(details, ["stockStatus", "quantity"])],
      ["Protein", detailValue(details, ["protein"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "crops_produce") {
    return [
      ["Grade", detailValue(details, ["grade", "variety"])],
      ["Quantity", detailValue(details, ["quantity"])],
      ["Delivery", detailValue(details, ["delivery", "packaging"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "infrastructure") {
    return [
      ["Size", detailValue(details, ["size"])],
      ["Condition", detailValue(details, ["condition"])],
      ["Material", detailValue(details, ["material"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  if (category === "agri_services") {
    return [
      ["Service", detailValue(details, ["serviceType"])],
      ["Availability", detailValue(details, ["availability"])],
      ["Coverage", detailValue(details, ["coverageArea"])]
    ].filter(([, value]) => Boolean(value)).slice(0, 3);
  }

  return [
    ["Quantity", detailValue(details, ["quantity"])],
    ["Condition", detailValue(details, ["condition"])],
    ["Details", detailValue(details, ["stockStatus", "specifications"])]
  ].filter(([, value]) => Boolean(value)).slice(0, 3);
}

function MarketplaceHomeListingCard({ listing, isSaved, returnPath = "/marketplace" }: { listing: any; isSaved: boolean; returnPath?: string }) {
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
  const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
  const animalPhotos = Array.isArray(animal?.animal_media)
    ? animal.animal_media
        .filter((item: any) => item.media_type === "photo")
        .sort((a: any, b: any) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
    : [];
  const photo = listingMedia.find((item: any) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item: any) => item.media_type === "photo") ?? animalPhotos[0];
  const bucket = listingMedia.includes(photo) ? "farm-assets" : "animal-media";
  const location = [listing.town, listing.province].filter(Boolean).join(", ") || listing.approximate_location || "Location not set";
  const verified = (Array.isArray(listing.farms) ? listing.farms[0] : listing.farms)?.seller_verification_status === "verified";
  const quickInfo = quickInfoForListing(listing);
  const detailHref = `/marketplace/${listing.id}?returnTo=${encodeURIComponent(returnPath)}`;
  const saveRedirectHref = `${returnPath}${returnPath.includes("?") ? "&" : "?"}message=${encodeURIComponent(isSaved ? "Removed from favourites." : "Saved to your favourites.")}`;

  return (
    <article id={`listing-${listing.id}`} className="group relative overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
      <Link href={detailHref as never} className="absolute inset-0 z-10" aria-label={`Open ${listing.title}`} />
      <div className="relative">
        <div>
          {photo?.storage_path ? (
            <img src={publicStorageUrl(bucket, photo.storage_path)} alt={listing.title} className="h-36 w-full object-cover" />
          ) : (
            <div className="grid h-36 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>
          )}
        </div>
        {verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-green px-2 py-1 text-xs font-bold text-white">
            <ShieldCheck size={13} />
            Verified
          </span>
        ) : null}
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <MarketplaceShareButton title={listing.title} url={`/marketplace/${listing.id}`} listingId={listing.id} />
          <form action={toggleSavedListing} className="relative z-20">
            <input type="hidden" name="listingId" value={listing.id} />
            <input type="hidden" name="saved" value={isSaved ? "true" : "false"} />
            <input type="hidden" name="redirectTo" value={saveRedirectHref} />
            <button
              className={`grid h-9 w-9 place-items-center rounded-full border bg-white/95 shadow-soft transition hover:border-brand-green ${isSaved ? "border-red-200 text-red-600" : "border-slate-200 text-slate-600"}`}
              type="submit"
              aria-label={isSaved ? "Remove from favourites" : "Save to favourites"}
            >
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </form>
        </div>
      </div>
      <div className="relative p-3">
        <p className="line-clamp-2 font-bold text-brand-navy group-hover:text-brand-green">{listing.title}</p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-600">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{location}</span>
        </p>
        <p className="mt-2 line-clamp-1 text-sm text-slate-600">
          {marketplaceCategoryLabel(listing.category)}
          {marketplaceSubcategoryLabel(listing.category, listing.subcategory) ? ` · ${marketplaceSubcategoryLabel(listing.category, listing.subcategory)}` : ""}
          {species?.name ? ` · ${species.name}` : ""}
        </p>
        {quickInfo.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
            {quickInfo.map(([label, value]) => <span key={`${label}-${value}`}>{label}: {String(value)}</span>)}
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-bold text-brand-green">{formatRand(listing.price)}</p>
          <Link
            href={`/marketplace/${listing.id}?contact=1&returnTo=${encodeURIComponent(returnPath)}` as never}
            className="relative z-20 rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-brand-green"
          >
            Contact
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; q?: string; category?: string; subcategory?: string; location?: string; sex?: string; price?: string; contact?: string }>;
}) {
  const params = await searchParams;
  const { message, q = "", subcategory = "", location = "", sex = "all", price = "all", contact = "" } = params;
  const category = params.category && params.category !== "all" ? normalizeMarketplaceCategory(params.category) : "all";
  const hasSearch = Boolean(q.trim());
  const availableSubcategories = category === "all" ? [] : marketplaceSubcategories(category);
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (category && category !== "all") returnParams.set("category", category);
  if (subcategory) returnParams.set("subcategory", subcategory);
  if (location) returnParams.set("location", location);
  if (sex && sex !== "all") returnParams.set("sex", sex);
  if (price && price !== "all") returnParams.set("price", price);
  const returnPath = `/marketplace${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;
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
  const canSell = ["seller", "admin", "super_admin"].includes(profile?.account_role ?? "buyer");
  const sellHref = !user ? "/login?next=%2Fmarketplace%2Fcreate" : canSell ? "/marketplace/create" : "/onboarding?next=%2Fmarketplace%2Fcreate";
  let listingQuery = supabase
    .from("marketplace_listings")
    .select(`
      id,
      seller_farm_id,
      animal_id,
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
      saved_count,
      animals(animal_code, tag_number, breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
      marketplace_listing_media(storage_path, media_type, is_primary, created_at),
      farms:seller_farm_id(id, name, seller_verification_status)
    `)
    .eq("status", "active");

  if (!hasSearch && category !== "all") {
    listingQuery = listingQuery.eq("category", category);
  }

  if (!hasSearch && subcategory.trim()) {
    listingQuery = listingQuery.eq("subcategory", subcategory.trim());
  }

  if (location.trim()) {
    const place = location.trim().replace(/[%_]/g, "");
    listingQuery = listingQuery.or(`province.ilike.%${place}%,town.ilike.%${place}%,approximate_location.ilike.%${place}%`);
  }

  if (price === "under_5000") {
    listingQuery = listingQuery.lt("price", 5000);
  } else if (price === "5000_20000") {
    listingQuery = listingQuery.gte("price", 5000).lte("price", 20000);
  } else if (price === "over_20000") {
    listingQuery = listingQuery.gt("price", 20000);
  }

  const { data: rawListings } = await listingQuery
    .order("created_at", { ascending: false })
    .limit(hasSearch ? 120 : 24);
  const searchFilteredListings = q.trim()
    ? (rawListings ?? []).filter((listing) => searchMatchesListing(listing, q))
    : rawListings;
  const listings = sex === "all"
    ? searchFilteredListings
    : (searchFilteredListings ?? []).filter((listing) => {
        const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
        return String(animal?.gender ?? "").toLowerCase() === sex;
      });
  const { data: savedListings } = user
    ? await supabase
        .from("marketplace_saved_listings")
        .select("listing_id")
        .eq("user_id", user.id)
    : { data: [] };
  const savedListingIds = new Set((savedListings ?? []).map((item) => item.listing_id));
  const { data: listingCountRows } = await supabase
    .from("marketplace_listings")
    .select("category, subcategory")
    .eq("status", "active")
    .limit(1000);
  const listingCounts = new Map<string, number>();
  for (const row of listingCountRows ?? []) {
    listingCounts.set(listingCountKey(row.category), (listingCounts.get(listingCountKey(row.category)) ?? 0) + 1);
    if (row.subcategory) {
      listingCounts.set(listingCountKey(row.category, row.subcategory), (listingCounts.get(listingCountKey(row.category, row.subcategory)) ?? 0) + 1);
    }
  }
  const moreCategoryGroups = marketplaceCategoryTree.map((categoryItem) => ({
    title: categoryItem.label,
    items: [
      {
        label: categoryItem.label,
        href: marketplaceCategoryUrl(categoryItem.slug),
        count: listingCounts.get(listingCountKey(categoryItem.slug)) ?? 0,
        active: category === categoryItem.slug && !subcategory
      },
      ...categoryItem.subcategories.map((subcategoryItem) => ({
        label: subcategoryItem.label,
        href: marketplaceCategoryUrl(categoryItem.slug, subcategoryItem.slug),
        count: listingCounts.get(listingCountKey(categoryItem.slug, subcategoryItem.slug)) ?? 0,
        active: category === categoryItem.slug && subcategory === subcategoryItem.slug
      }))
    ]
  }));
  const { data: featuredFarmRows } = await supabase
    .from("farms")
    .select("id, name, logo_url, photo_url, location, province, country, seller_verification_status, marketplace_listings(id, status)")
    .eq("seller_verification_status", "verified")
    .limit(4);
  const featuredFarms = featuredFarmRows ?? [];
  const [activeListingsCount, verifiedFarmsCount, animalsRecordedCount, activeSellersCount] = showMarketplaceStats
    ? await Promise.all([
        supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("farms").select("id", { count: "exact", head: true }).eq("seller_verification_status", "verified"),
        supabase.from("animals").select("id", { count: "exact", head: true }),
        supabase.from("marketplace_listings").select("seller_farm_id").eq("status", "active").limit(200)
      ])
    : [{ count: 0 }, { count: 0 }, { count: 0 }, { data: [] }];
  const activeSellerTotal = new Set((activeSellersCount.data ?? []).map((item: any) => item.seller_farm_id).filter(Boolean)).size;

  const content = (
    <>
      <section className="mb-5 overflow-hidden rounded-lg bg-brand-navy text-white shadow-soft">
        <div className="bg-[radial-gradient(circle_at_75%_20%,rgba(46,125,50,0.75),transparent_30%),linear-gradient(120deg,#052e16_0%,#0f172a_55%,#1f3b1f_100%)] p-6 sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The Smart Way to Buy &amp; Sell Agri</h1>
            <p className="mt-3 max-w-xl text-sm text-green-50 sm:text-base">Livestock, equipment, feed, crops and services. All in one trusted marketplace.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={sellHref as never} className="primary-button bg-green-600 hover:bg-green-700">Sell Your Item</Link>
              <Link href="/account/support/help-centre" className="secondary-button border-white/40 bg-white/10 text-white hover:border-white hover:text-white">How It Works</Link>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {message}
        </div>
      ) : null}

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {categoryShortcuts.map((item) => {
            const Icon = item.icon;

            if (item.label === "More Categories") {
              return <MoreCategoriesMenu key={item.label} groups={moreCategoryGroups} />;
            }

            return (
              <Link
                key={item.label}
                href={item.href as never}
                className={`grid justify-items-center gap-2 rounded-md p-2 text-center text-xs font-bold transition ${
                  item.href.includes(`category=${category}`) && !subcategory
                    ? "bg-brand-green text-white"
                    : "text-brand-navy hover:bg-green-50 hover:text-brand-green"
                }`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-full ${
                  item.href.includes(`category=${category}`) && !subcategory ? "bg-white/15 text-white" : "bg-green-50 text-brand-green"
                }`}>
                  <Icon size={22} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <details className="mb-5 rounded-md border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-bold text-brand-navy">Filter listings</summary>
        <form className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select className="field" name="category" defaultValue={category}>
            <option value="all">All categories</option>
            {marketplaceCategories.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className="field" name="subcategory" defaultValue={subcategory} disabled={category === "all"}>
            <option value="">{category === "all" ? "Choose category first" : "All subcategories"}</option>
            {availableSubcategories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.label}</option>
            ))}
          </select>
          <input className="field" name="location" placeholder="Province or town" defaultValue={location} />
          <select className="field" name="sex" defaultValue={sex}>
            <option value="all">Any sex</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <select className="field" name="price" defaultValue={price}>
            <option value="all">Any price</option>
            <option value="under_5000">Under R5,000</option>
            <option value="5000_20000">R5,000 - R20,000</option>
            <option value="over_20000">Over R20,000</option>
          </select>
          <div className="flex gap-2">
            <button className="primary-button flex-1" type="submit">Filter</button>
            <Link href="/marketplace" className="secondary-button flex-1">Clear</Link>
          </div>
        </form>
      </details>
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Recently Added</h2>
            <p className="mt-1 text-sm text-slate-600">Latest approved listings across all categories.</p>
          </div>
          <a href="#marketplace-results" className="text-sm font-bold text-brand-green">View all</a>
        </div>
        {(listings ?? []).length === 0 ? (
          <section className="panel p-6 text-center">
            <h3 className="font-bold">{q ? `No listings found for ${q}` : "No marketplace listings yet"}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {q ? "Try a popular search or browse a category below." : "Approved listings will appear here as sellers publish them."}
            </p>
            {q ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Bakkies", "Tractors", "Boer goats", "Lucerne bales"].map((item) => (
                  <Link key={item} href={`/marketplace?q=${encodeURIComponent(item)}` as never} className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-brand-green">
                    {item}
                  </Link>
                ))}
              </div>
            ) : null}
            <Link href={sellHref as never} className="primary-button mt-4">Create listing</Link>
          </section>
        ) : (
          <div id="marketplace-results" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(listings ?? []).map((listing) => (
          <MarketplaceHomeListingCard key={listing.id} listing={listing} isSaved={savedListingIds.has(listing.id)} returnPath={returnPath} />
            ))}
          </div>
        )}
      </section>
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Featured Farms</h2>
            <p className="mt-1 text-sm text-slate-600">Verified farm profiles with active marketplace activity.</p>
          </div>
          <Link href="/farms" className="text-sm font-bold text-brand-green">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredFarms.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Verified farms will appear here.</div>
          ) : null}
          {featuredFarms.map((featuredFarm) => {
            const activeCount = Array.isArray(featuredFarm.marketplace_listings)
              ? featuredFarm.marketplace_listings.filter((listing: any) => listing.status === "active").length
              : 0;
            const locationText = featuredFarm.location || [featuredFarm.province, featuredFarm.country].filter(Boolean).join(", ") || "South Africa";

            return (
              <Link key={featuredFarm.id} href={`/farms/${featuredFarm.id}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
                {featuredFarm.photo_url ? (
                  <img src={featuredFarm.photo_url} alt={featuredFarm.name} className="h-28 w-full object-cover" />
                ) : (
                  <div className="grid h-28 place-items-center bg-green-50 text-sm font-bold text-brand-green">Farm</div>
                )}
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {featuredFarm.logo_url ? (
                      <img src={featuredFarm.logo_url} alt={featuredFarm.name} className="-mt-9 h-14 w-14 rounded-full border-4 border-white object-cover" />
                    ) : (
                      <div className="-mt-9 grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-white bg-green-50 text-xs font-bold text-brand-green">Farm</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-brand-navy">{featuredFarm.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} /> {locationText}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-brand-green">Verified Farm</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{activeCount} active listings</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Wanted Listings</h2>
            <p className="mt-1 text-sm text-slate-600">Buyer requests from farmers looking for livestock and agri products.</p>
          </div>
          <Link href="/marketplace/wanted" className="text-sm font-bold text-brand-green">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {wantedListings.map((wanted) => {
            const Icon = wanted.icon;
            return (
              <article key={wanted.title} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-50 text-brand-green">
                    <Icon size={22} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Wanted</p>
                    <h3 className="font-bold text-brand-navy">{wanted.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{wanted.location}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{wanted.budget}</p>
                    <p className="mt-1 text-xs text-slate-500">Quantity: {wanted.quantity}</p>
                  </div>
                </div>
                <Link href={`/marketplace/wanted?request=${encodeURIComponent(wanted.title)}` as never} className="secondary-button mt-4 w-full">View Details</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold text-brand-navy">Browse by Province</h3>
            <p className="mt-1 text-sm text-slate-600">Find livestock, farm products and verified farms near you.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {provinceDirectory.map((province) => (
            <Link
              key={province.slug}
              href={`/province/${province.slug}` as never}
              className="rounded-md border border-slate-200 px-3 py-3 text-sm transition hover:border-brand-green"
            >
              <span className="block font-bold text-brand-navy">{province.name}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{provincePreview(province)}</span>
            </Link>
          ))}
          <Link
            href="/marketplace"
            className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm transition hover:border-brand-green"
          >
            <span className="block font-bold text-brand-green">Browse All South Africa Listings</span>
            <span className="mt-1 block text-xs font-semibold text-green-900">Livestock • Feed • Produce • Equipment</span>
          </Link>
        </div>
      </section>
      {showMarketplaceStats ? (
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { title: "Active Listings", value: activeListingsCount.count ?? 12_540, subtitle: "Across all categories", icon: ShoppingCart },
          { title: "Verified Farms", value: verifiedFarmsCount.count ?? 4_320, subtitle: "Trusted sellers", icon: ShieldCheck },
          { title: "Animals Recorded", value: animalsRecordedCount.count ?? 87_000, subtitle: "On AgriMarketX", icon: PawPrint },
          { title: "Active Sellers", value: activeSellerTotal || 2_100, subtitle: "Growing every day", icon: Users },
          { title: "Positive Feedback", value: "98%", subtitle: "From our community", icon: Heart }
        ].map((stat) => {
          const Icon = stat.icon;

          return (
          <div key={stat.title} className="rounded-md border border-slate-200 bg-green-50/60 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-green">
                <Icon size={22} />
              </span>
              <div>
                <p className="text-xl font-bold text-brand-green">{typeof stat.value === "number" ? stat.value.toLocaleString("en-ZA") : stat.value}</p>
                <p className="text-sm font-bold text-brand-navy">{stat.title}</p>
                <p className="text-xs text-slate-600">{stat.subtitle}</p>
              </div>
            </div>
          </div>
          );
        })}
      </section>
      ) : null}
      <section className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Verified Listings", subtitle: "Trusted sellers, quality assured", icon: ShieldCheck },
          { title: "Nationwide Delivery", subtitle: "Connect with transport options", icon: Truck },
          { title: "Safe Trading", subtitle: "Private details stay protected", icon: Home },
          { title: "Help & Support", subtitle: "We are here to help you grow", icon: LifeBuoy }
        ].map((item) => {
          const Icon = item.icon;

          return (
          <div key={item.title} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-brand-green">
              <Icon size={21} />
            </span>
            <div>
              <p className="font-bold text-brand-navy">{item.title}</p>
              <p className="text-sm text-slate-600">{item.subtitle}</p>
            </div>
          </div>
          );
        })}
      </section>
      <footer className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
        <div className="flex flex-wrap gap-4">
          <Link href="/help-centre" className="font-semibold hover:text-brand-green">Help Centre</Link>
          <Link href="/safety-advice" className="font-semibold hover:text-brand-green">Safety Advice</Link>
          <Link href="/marketplace-rules" className="font-semibold hover:text-brand-green">Marketplace Rules</Link>
          <Link href="/legal" className="font-semibold hover:text-brand-green">Legal</Link>
          <Link href="/about" className="font-semibold hover:text-brand-green">About AgriMarketX</Link>
          <Link href="/contact" className="font-semibold hover:text-brand-green">Contact</Link>
        </div>
        <p className="mt-3">AgriMarketX marketplace helps farmers manage, track and trade agricultural products safely.</p>
      </footer>
    </>
  );

  return (
    <MarketplacePageShell
      accountRole={profile?.account_role ?? "buyer"}
      q={q}
      category={category}
      subcategory={subcategory}
      userEmail={user?.email ?? profile?.email}
      userName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
    >
      {content}
    </MarketplacePageShell>
  );
}
