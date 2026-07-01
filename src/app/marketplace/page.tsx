import Link from "next/link";
import {
  Car,
  ChevronDown,
  Heart,
  Home,
  LifeBuoy,
  MapPin,
  MoreHorizontal,
  Package,
  PawPrint,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Tractor,
  Truck,
  Users,
  Warehouse,
  Wheat,
  Wrench
} from "lucide-react";
import { FeaturedListingsCarousel } from "@/components/FeaturedListingsCarousel";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { MarketplaceShareButton } from "@/components/MarketplaceShareButton";
import { MoreCategoriesMenu } from "@/components/MoreCategoriesMenu";
import { SaveListingButton } from "@/components/SaveListingButton";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import { exactListingCoordinates, formatDistanceKm, haversineDistanceKm, parseCoordinate, parseRadiusKm, publicAreaLabel, type Coordinates } from "@/lib/location-distance";
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
import { relatedMarketplaceCategories, type MarketplaceListingSuggestion } from "@/lib/marketplace-search";
import { findLocationInSearch, provinceDirectory, provincePreview, stripLocationFromSearch } from "@/lib/provinces";
import { sellerVerificationBadge } from "@/lib/seller-badges";
import { createPublicSupabaseClient } from "@/lib/supabase/public-server";

export const revalidate = 60;

const pageSize = 24;

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

const marketplaceListingSelect = `
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
  latitude,
  longitude,
  price_negotiable,
  category,
  subcategory,
  listing_details,
  status,
  saved_count,
  created_at,
  animals(animal_code, tag_number, breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
  marketplace_listing_media(storage_path, media_type, is_primary, created_at),
  farms:seller_farm_id(id, name, seller_verification_status, seller_account_role, seller_type, sponsored_partner)
`;

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
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return true;
  }

  const terms = expandMarketplaceSearchTerms(cleanQuery)
    .map((term) => term.toLowerCase().trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = listingSearchText(listing);
  return terms.some((term) => haystack.includes(term)) || haystack.includes(cleanQuery.toLowerCase());
}

function exactSearchMatchesListing(listing: any, query: string) {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return true;
  }

  const words = cleanQuery.split(/\s+/).map((word) => word.trim()).filter(Boolean);
  const haystack = listingSearchText(listing);
  return haystack.includes(cleanQuery) || words.every((word) => haystack.includes(word));
}

function listingCountKey(category: string | null | undefined, subcategory?: string | null) {
  return `${category ?? ""}::${subcategory ?? ""}`;
}

function pageNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function searchRadius(value: string) {
  const match = value.match(/\bwithin\s+(\d{1,3})\s*km\b/i);
  return match?.[1] ?? null;
}

function stripNearbySearchTerms(value: string) {
  return value
    .replace(/\bwithin\s+\d{1,3}\s*km\b/gi, " ")
    .replace(/\bnear\s+me\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocationText(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/near\s+/g, " ")
    .replace(/[,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function locationParts(location: string, detectedLocation: ReturnType<typeof findLocationInSearch>) {
  if (detectedLocation?.type === "town") {
    return {
      town: detectedLocation.town ?? "",
      province: detectedLocation.province ?? ""
    };
  }

  if (detectedLocation?.type === "province") {
    return {
      town: "",
      province: detectedLocation.province ?? ""
    };
  }

  const cleanLocation = location.trim();
  if (!cleanLocation) {
    return { town: "", province: "" };
  }

  const matchedProvince = provinceDirectory.find((province) => normalizeLocationText(cleanLocation).includes(normalizeLocationText(province.name)));
  const town = cleanLocation
    .split(",")
    .map((part) => part.trim())
    .find((part) => part && normalizeLocationText(part) !== normalizeLocationText(matchedProvince?.name));

  return {
    town: town ?? "",
    province: matchedProvince?.name ?? ""
  };
}

function listingMatchesTown(listing: any, town: string) {
  const cleanTown = normalizeLocationText(town);
  if (!cleanTown) {
    return false;
  }

  return [
    listing.town,
    listing.approximate_location
  ].some((value) => normalizeLocationText(value).includes(cleanTown));
}

function listingMatchesProvince(listing: any, province: string) {
  const cleanProvince = normalizeLocationText(province);
  if (!cleanProvince) {
    return false;
  }

  return [
    listing.province,
    listing.approximate_location
  ].some((value) => normalizeLocationText(value).includes(cleanProvince));
}

function withListingDistances<T extends { latitude?: number | string | null; longitude?: number | string | null; town?: string | null; province?: string | null }>(
  listings: T[] | null | undefined,
  center: Coordinates | null,
  radiusKm: number | null
) {
  const rows = (listings ?? []).map((listing) => {
    if (!center) {
      return {
        ...listing,
        distance_km: null
      };
    }

    const coords = center ? exactListingCoordinates(listing) : null;
    const distance = center && coords ? haversineDistanceKm(center, coords) : null;

    return {
      ...listing,
      distance_km: distance
    };
  });

  const filtered = center && radiusKm
    ? rows.filter((listing) => typeof listing.distance_km === "number" && listing.distance_km <= radiusKm)
    : rows;

  return center
    ? filtered.sort((a, b) => Number(a.distance_km ?? Number.MAX_SAFE_INTEGER) - Number(b.distance_km ?? Number.MAX_SAFE_INTEGER))
    : filtered;
}

function locationFallbackListings<T extends { latitude?: number | string | null; longitude?: number | string | null; town?: string | null; province?: string | null }>(
  listings: T[] | null | undefined,
  options: {
    center: Coordinates | null;
    radiusKm: number | null;
    town: string;
    province: string;
    useLocation: boolean;
  }
) {
  const allListings = withListingDistances(listings, options.center, null);
  const listingsWithCoordinates = allListings.filter((listing) => exactListingCoordinates(listing)).length;
  const radiusKm = options.radiusKm;
  const distanceMatched = options.center && radiusKm
    ? allListings.filter((listing) => typeof listing.distance_km === "number" && listing.distance_km <= radiusKm)
    : [];
  const cityMatched = options.useLocation && options.town
    ? allListings.filter((listing) => listingMatchesTown(listing, options.town))
    : [];
  const provinceMatched = options.useLocation && options.province
    ? allListings.filter((listing) => listingMatchesProvince(listing, options.province))
    : [];
  const finalListings = distanceMatched.length > 0
    ? distanceMatched
    : cityMatched.length > 0
      ? cityMatched
      : provinceMatched.length > 0
        ? provinceMatched
        : allListings;

  console.info("[marketplace-location]", {
    totalApprovedListings: allListings.length,
    listingsWithCoordinates,
    distanceMatched: distanceMatched.length,
    cityMatched: cityMatched.length,
    provinceMatched: provinceMatched.length,
    finalDisplayedCount: finalListings.length
  });

  return finalListings;
}

function listingSellerIsVerified(listing: any) {
  const farm = Array.isArray(listing.farms) ? listing.farms[0] : listing.farms;
  return farm?.seller_verification_status === "verified";
}

function promotedFarm(listing: any) {
  const farm = Array.isArray(listing.farms) ? listing.farms[0] : listing.farms;
  return Boolean(farm?.sponsored_partner || farm?.seller_account_role === "sponsored_partner" || farm?.seller_account_role === "advertiser");
}

function featuredPromotionScore(listing: any) {
  const details = listing.listing_details as Record<string, unknown> | null | undefined;
  const packageText = [
    details?.promotion_package,
    details?.promotion_type,
    details?.promotion,
    details?.advert_package,
    details?.featured_package
  ].filter(Boolean).join(" ").toLowerCase();
  const statusText = String(details?.promotion_status ?? details?.featured_status ?? "").toLowerCase();
  const endsAt = Date.parse(String(details?.promotion_ends_at ?? details?.promotion_end_date ?? details?.featured_until ?? ""));
  const promotionExpired = Number.isFinite(endsAt) && endsAt < Date.now();
  const hasPromotionFlag = Boolean(details?.featured || details?.is_featured || details?.premium || details?.is_premium || details?.urgent || details?.is_urgent);
  const hasActivePackage = (hasPromotionFlag || /featured|premium|urgent|promoted|sponsored/.test(packageText)) && statusText !== "expired" && !promotionExpired;

  let score = 0;

  if (hasActivePackage) {
    score += 1000;
  }

  if (/premium/.test(packageText) || details?.premium || details?.is_premium) {
    score += 300;
  }

  if (/featured|promoted|sponsored/.test(packageText) || details?.featured || details?.is_featured) {
    score += 200;
  }

  if (/urgent/.test(packageText) || details?.urgent || details?.is_urgent) {
    score += 100;
  }

  if (promotedFarm(listing)) {
    score += 50;
  }

  const explicitPriority = Number(details?.promotion_priority ?? details?.featured_priority ?? details?.priority);

  return score + (Number.isFinite(explicitPriority) ? explicitPriority : 0);
}

function featuredPromotionDate(listing: any) {
  const details = listing.listing_details as Record<string, unknown> | null | undefined;
  const rawDate = details?.promotion_started_at
    ?? details?.promotion_start_date
    ?? details?.featured_started_at
    ?? details?.featured_from
    ?? listing.created_at;
  const timestamp = Date.parse(String(rawDate ?? ""));

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dailyRotationScore(id: string) {
  const seed = `${new Date().toISOString().slice(0, 10)}:${id}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function sortFeaturedListings<T extends { id: string; created_at?: string | null }>(listings: T[] | null | undefined) {
  return [...(listings ?? [])].sort((a: any, b: any) => {
    const promotionDifference = featuredPromotionScore(b) - featuredPromotionScore(a);

    if (promotionDifference !== 0) {
      return promotionDifference;
    }

    const dateDifference = featuredPromotionDate(b) - featuredPromotionDate(a);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return dailyRotationScore(b.id) - dailyRotationScore(a.id);
  });
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

function MarketplaceHomeListingCard({
  listing,
  isSaved,
  returnPath = "/marketplace",
  showDistance = false
}: {
  listing: any;
  isSaved: boolean;
  returnPath?: string;
  showDistance?: boolean;
}) {
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
  const farm = Array.isArray(listing.farms) ? listing.farms[0] : listing.farms;
  const badge = sellerVerificationBadge(farm?.seller_verification_status, farm?.seller_account_role, farm?.seller_type, farm?.sponsored_partner);
  const quickInfo = quickInfoForListing(listing);
  const detailHref = `/marketplace/${listing.id}?returnTo=${encodeURIComponent(returnPath)}`;

  return (
    <article id={`listing-${listing.id}`} className="group relative overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
      <Link href={detailHref as never} className="absolute inset-0 z-10" aria-label={`Open ${listing.title}`} />
      <div className="relative">
        <div>
          {photo?.storage_path ? (
            <img src={publicStorageUrl(bucket, photo.storage_path)} alt={listing.title} className="h-36 w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="grid h-36 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>
          )}
        </div>
        {badge ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-green px-2 py-1 text-xs font-bold text-white">
            <ShieldCheck size={13} />
            {badge}
          </span>
        ) : null}
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <MarketplaceShareButton title={listing.title} url={`/marketplace/${listing.id}`} listingId={listing.id} />
          <SaveListingButton listingId={listing.id} initiallySaved={isSaved} />
        </div>
      </div>
      <div className="relative p-3">
        <p className="line-clamp-2 font-bold text-brand-navy group-hover:text-brand-green">{listing.title}</p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-600">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{location}</span>
        </p>
        {showDistance && listing.distance_km !== null && listing.distance_km !== undefined ? (
          <p className="mt-1 text-xs font-bold text-brand-green">{formatDistanceKm(listing.distance_km)}</p>
        ) : null}
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
  searchParams: Promise<{ message?: string; q?: string; category?: string; subcategory?: string; location?: string; lat?: string; lng?: string; radius?: string; sex?: string; price?: string; verified?: string; sort?: string; contact?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { message, q = "", subcategory = "", location = "", lat = "", lng = "", radius = "", sex = "all", price = "all", verified = "all", sort = "newest", contact = "" } = params;
  const currentPage = pageNumber(params.page);
  const offset = (currentPage - 1) * pageSize;
  const category = params.category && params.category !== "all" ? normalizeMarketplaceCategory(params.category) : "all";
  const detectedLocation = findLocationInSearch(q);
  const radiusFromQuery = searchRadius(q);
  const selectedRadius = radius || radiusFromQuery || "all";
  const searchWithoutLocation = stripNearbySearchTerms(stripLocationFromSearch(q, detectedLocation));
  const hasSearch = Boolean(q.trim());
  const hasTextSearch = Boolean(searchWithoutLocation.trim());
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);
  const radiusKm = parseRadiusKm(selectedRadius);
  const hasCoordinateLocation = latitude !== null && longitude !== null;
  const nearbyCenter = hasCoordinateLocation ? { latitude, longitude } : null;
  const hasExplicitLocationContext = Boolean(nearbyCenter && hasCoordinateLocation);
  const hasNearbyFilter = Boolean(hasExplicitLocationContext && nearbyCenter && radiusKm);
  const hasLocationContext = hasExplicitLocationContext;
  const requestedLocation = locationParts(location, detectedLocation);
  const hasLocationFilter = Boolean(location.trim() || detectedLocation);
  const availableSubcategories = category === "all" ? [] : marketplaceSubcategories(category);
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (category && category !== "all") returnParams.set("category", category);
  if (subcategory) returnParams.set("subcategory", subcategory);
  if (location) returnParams.set("location", location);
  if (lat) returnParams.set("lat", lat);
  if (lng) returnParams.set("lng", lng);
  if (selectedRadius && selectedRadius !== "all") returnParams.set("radius", selectedRadius);
  if (sex && sex !== "all") returnParams.set("sex", sex);
  if (price && price !== "all") returnParams.set("price", price);
  if (verified && verified !== "all") returnParams.set("verified", verified);
  if (sort && sort !== "newest") returnParams.set("sort", sort);
  const returnPath = `/marketplace${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;
  const supabase = createPublicSupabaseClient();
  const sellHref = "/marketplace/create";
  let listingQuery = supabase
    .from("marketplace_listings")
    .select(marketplaceListingSelect)
    .eq("status", "active");

  if (category !== "all") {
    listingQuery = listingQuery.eq("category", category);
  }

  if (subcategory.trim()) {
    listingQuery = listingQuery.eq("subcategory", subcategory.trim());
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
    .range(hasSearch || hasLocationContext || hasLocationFilter ? 0 : offset, hasSearch || hasLocationContext || hasLocationFilter ? 499 : offset + pageSize - 1);
  const nearbyListings = locationFallbackListings(rawListings, {
    center: hasLocationContext ? nearbyCenter : null,
    radiusKm,
    town: requestedLocation.town,
    province: requestedLocation.province,
    useLocation: hasLocationFilter || hasLocationContext
  });
  const exactSearchListings = hasTextSearch
    ? (nearbyListings ?? []).filter((listing) => exactSearchMatchesListing(listing, searchWithoutLocation))
    : nearbyListings;
  const relatedCategoryMatches = hasTextSearch && (exactSearchListings ?? []).length === 0
    ? relatedMarketplaceCategories(searchWithoutLocation)
    : [];
  const relatedCategorySet = new Set(relatedCategoryMatches.map((item) => item.category));
  const searchFilteredListings = hasTextSearch
    ? (exactSearchListings ?? []).length > 0
      ? exactSearchListings
      : relatedCategoryMatches.length > 0
        ? (nearbyListings ?? []).filter((listing) => relatedCategorySet.has(normalizeMarketplaceCategory(listing.category)) || searchMatchesListing(listing, searchWithoutLocation))
        : []
    : nearbyListings;
  const listings = sex === "all"
    ? searchFilteredListings
    : (searchFilteredListings ?? []).filter((listing) => {
        const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
        return String(animal?.gender ?? "").toLowerCase() === sex;
      });
  const verifiedListings = verified === "verified"
    ? (listings ?? []).filter(listingSellerIsVerified)
    : listings;
  const sortedListings = [...(verifiedListings ?? [])].sort((a, b) => {
    if (sort === "nearest" && hasLocationContext) {
      return Number(a.distance_km ?? Number.MAX_SAFE_INTEGER) - Number(b.distance_km ?? Number.MAX_SAFE_INTEGER);
    }

    if (sort === "price_asc") {
      return Number(a.price ?? Number.MAX_SAFE_INTEGER) - Number(b.price ?? Number.MAX_SAFE_INTEGER);
    }

    if (sort === "price_desc") {
      return Number(b.price ?? 0) - Number(a.price ?? 0);
    }

    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });
  const needsClientPaging = hasSearch || hasLocationContext || hasLocationFilter || verified !== "all" || sort !== "newest";
  const pagedListings = needsClientPaging ? sortedListings.slice(offset, offset + pageSize) : sortedListings;
  const hasNextPage = needsClientPaging ? sortedListings.length > offset + pageSize : (rawListings ?? []).length === pageSize;
  const savedListingIds = new Set<string>();
  const { data: listingCountRows } = await supabase
    .from("marketplace_listings")
    .select("id, title, category, subcategory, province, town, approximate_location")
    .eq("status", "active")
    .limit(5000);
  const listingCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  for (const row of listingCountRows ?? []) {
    listingCounts.set(listingCountKey(row.category), (listingCounts.get(listingCountKey(row.category)) ?? 0) + 1);
    if (row.subcategory) {
      listingCounts.set(listingCountKey(row.category, row.subcategory), (listingCounts.get(listingCountKey(row.category, row.subcategory)) ?? 0) + 1);
    }

    if (row.province) {
      locationCounts.set(String(row.province).toLowerCase(), (locationCounts.get(String(row.province).toLowerCase()) ?? 0) + 1);
    }

    if (row.town && row.province) {
      const townKey = `${String(row.town).toLowerCase()}::${String(row.province).toLowerCase()}`;
      locationCounts.set(townKey, (locationCounts.get(townKey) ?? 0) + 1);
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
  const locationCountObject = Object.fromEntries(locationCounts);
  const categoryCountObject = Object.fromEntries(listingCounts);
  const listingSuggestions: MarketplaceListingSuggestion[] = (listingCountRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    province: row.province,
    town: row.town,
    approximate_location: row.approximate_location
  }));
  const { data: featuredListingRows } = await supabase
    .from("marketplace_listings")
    .select(marketplaceListingSelect)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(80);
  const { data: featuredFarmRows } = await supabase
    .from("farms")
    .select("id, name, logo_url, photo_url, location, province, country, seller_verification_status, seller_account_role, seller_type, sponsored_partner, marketplace_listings(id, status)")
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
  const featuredListings = sortFeaturedListings(featuredListingRows).slice(0, 12);
  const recommendedListings = sortedListings.slice(4, 8);
  const resultLocationLabel = location.trim()
    || (hasLocationContext && nearbyCenter && latitude !== null && longitude !== null ? publicAreaLabel(nearbyCenter) : "")
    || (detectedLocation?.type === "town"
      ? [detectedLocation.town, detectedLocation.province].filter(Boolean).join(", ")
      : detectedLocation?.province)
    || "";

  const content = (
    <>
      {message ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {message}
        </div>
      ) : null}

      {resultLocationLabel ? (
        <p className="mb-3 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 lg:hidden">
          Results in <span className="font-bold text-brand-green">{resultLocationLabel}</span>
          <MapPin size={16} className="text-brand-green" />
        </p>
      ) : null}

      <FeaturedListingsCarousel listings={featuredListings} returnPath={returnPath} showDistance={false} />

      <section id="marketplace-categories" className="scroll-mt-28 mb-5 border-b border-slate-200 bg-white pb-5 lg:rounded-md lg:border lg:border-slate-200 lg:p-4 lg:shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand-navy">Browse Categories</h2>
          <a href="#marketplace-results" className="text-sm font-bold text-brand-green lg:hidden">See all</a>
        </div>
        <div className="grid grid-cols-5 gap-x-1.5 gap-y-3 lg:grid-cols-9 lg:gap-3">
          {categoryShortcuts.map((item) => {
            const Icon = item.icon;

            if (item.label === "More Categories") {
              return (
                <MoreCategoriesMenu
                  key={item.label}
                  groups={moreCategoryGroups}
                  currentCategory={category}
                  locationCounts={locationCountObject}
                  categoryCounts={categoryCountObject}
                  listingSuggestions={listingSuggestions}
                />
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href as never}
                className={`grid justify-items-center gap-1 rounded-md p-1 text-center text-[10px] font-bold leading-tight transition sm:p-1.5 sm:text-[11px] lg:gap-2 lg:p-2 lg:text-xs ${
                  item.href.includes(`category=${category}`) && !subcategory
                    ? "bg-brand-green text-white"
                    : "text-brand-navy hover:bg-green-50 hover:text-brand-green"
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-full sm:h-11 sm:w-11 lg:h-12 lg:w-12 ${
                  item.href.includes(`category=${category}`) && !subcategory ? "bg-white/15 text-white" : "bg-green-50 text-brand-green"
                }`}>
                  <Icon size={20} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <details className="group mb-5 rounded-xl border border-slate-200 bg-white shadow-sm lg:p-4">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-bold text-brand-navy [&::-webkit-details-marker]:hidden lg:px-0">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-brand-green" />
            <span>Filter listings</span>
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-full text-brand-green">
            <ChevronDown size={22} className="transition-transform duration-200 group-open:rotate-180" />
          </span>
        </summary>
        <form className="fixed inset-x-0 bottom-0 z-[80] max-h-[82dvh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-[0_-18px_45px_rgba(15,23,42,0.18)] group-open:block lg:static lg:mt-4 lg:grid lg:max-h-none lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:rounded-none lg:border-0 lg:p-0 lg:pb-0 lg:shadow-none xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="text-base font-bold">Filter listings</p>
            <span className="text-xs font-semibold text-slate-500">Choose and apply</span>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Category</span>
            <select className="field" name="category" defaultValue={category}>
              <option value="all">All categories</option>
              {marketplaceCategories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Subcategory</span>
            <select className="field" name="subcategory" defaultValue={subcategory} disabled={category === "all"}>
              <option value="">{category === "all" ? "Choose category first" : "All subcategories"}</option>
              {availableSubcategories.map((item) => (
                <option key={item.slug} value={item.slug}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Province or city</span>
            <input className="field" name="location" placeholder="Province or town" defaultValue={location} />
          </label>
          <input type="hidden" name="lat" value={lat} />
          <input type="hidden" name="lng" value={lng} />
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Radius</span>
            <select className="field" name="radius" defaultValue={selectedRadius}>
              <option value="all">Nationwide</option>
              <option value="5">Within 5km</option>
              <option value="10">Within 10km</option>
              <option value="25">Within 25km</option>
              <option value="50">Within 50km</option>
              <option value="100">Within 100km</option>
            </select>
          </label>
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Price range</span>
            <select className="field" name="price" defaultValue={price}>
              <option value="all">Any price</option>
              <option value="under_5000">Under R5,000</option>
              <option value="5000_20000">R5,000 - R20,000</option>
              <option value="over_20000">Over R20,000</option>
            </select>
          </label>
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Seller verification</span>
            <select className="field" name="verified" defaultValue={verified}>
              <option value="all">Any seller</option>
              <option value="verified">Verified sellers</option>
            </select>
          </label>
          <label className="mt-3 block lg:mt-0">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 lg:hidden">Sort by</span>
            <select className="field" name="sort" defaultValue={sort}>
              <option value="newest">Newest</option>
              <option value="nearest">Nearest</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
            </select>
          </label>
          <select className="field mt-3 lg:mt-0" name="sex" defaultValue={sex}>
            <option value="all">Any sex</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <div className="fixed inset-x-0 bottom-0 z-[81] grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 lg:static lg:flex lg:border-0 lg:p-0">
            <Link href="/marketplace" className="secondary-button justify-center">Reset</Link>
            <button className="primary-button justify-center" type="submit">Apply</button>
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
        {hasTextSearch && relatedCategoryMatches.length > 0 && (pagedListings ?? []).length > 0 ? (
          <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-3 py-3 text-sm text-green-950">
            <p className="font-bold">
              No exact results found. Showing related results for {relatedCategoryMatches.map((item) => item.label).join(", ")}.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {relatedCategoryMatches.map((item) => (
                <Link
                  key={item.category}
                  href={`/marketplace?category=${item.category}&q=${encodeURIComponent(q)}` as never}
                  className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-green"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {(pagedListings ?? []).length === 0 ? (
          <section className="panel p-6 text-center">
            <h3 className="font-bold">{(listingCountRows ?? []).length > 0 ? "No matching listings" : "No marketplace listings yet"}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {(listingCountRows ?? []).length > 0 ? "Try widening your filters or switching to Nationwide." : "Approved listings will appear here as sellers publish them."}
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
          <>
            <div id="marketplace-results" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(pagedListings ?? []).map((listing) => (
                <MarketplaceHomeListingCard key={listing.id} listing={listing} isSaved={savedListingIds.has(listing.id)} returnPath={returnPath} showDistance={hasLocationContext} />
              ))}
            </div>
            {(currentPage > 1 || hasNextPage) ? (
              <div className="mt-5 flex items-center justify-center gap-3">
                {currentPage > 1 ? (
                  <Link href={`/marketplace?${new URLSearchParams({ ...Object.fromEntries(returnParams), page: String(currentPage - 1) }).toString()}` as never} className="secondary-button">
                    Previous
                  </Link>
                ) : null}
                <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">Page {currentPage}</span>
                {hasNextPage ? (
                  <Link href={`/marketplace?${new URLSearchParams({ ...Object.fromEntries(returnParams), page: String(currentPage + 1) }).toString()}` as never} className="secondary-button">
                    Next
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Featured Farmers &amp; Sellers</h2>
            <p className="mt-1 text-sm text-slate-600">Verified farmers and sellers with active marketplace activity.</p>
          </div>
          <Link href="/farms" className="text-sm font-bold text-brand-green">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredFarms.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Verified farmers and sellers will appear here.</div>
          ) : null}
          {featuredFarms.map((featuredFarm) => {
            const activeCount = Array.isArray(featuredFarm.marketplace_listings)
              ? featuredFarm.marketplace_listings.filter((listing: any) => listing.status === "active").length
              : 0;
            const locationText = featuredFarm.location || [featuredFarm.province, featuredFarm.country].filter(Boolean).join(", ") || "South Africa";
            const badge = sellerVerificationBadge(featuredFarm.seller_verification_status, featuredFarm.seller_account_role, featuredFarm.seller_type, featuredFarm.sponsored_partner);

            return (
              <Link key={featuredFarm.id} href={`/farms/${featuredFarm.id}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
                {featuredFarm.photo_url ? (
                  <img src={featuredFarm.photo_url} alt={featuredFarm.name} className="h-28 w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="grid h-28 place-items-center bg-green-50 text-sm font-bold text-brand-green">Farm</div>
                )}
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {featuredFarm.logo_url ? (
                      <img src={featuredFarm.logo_url} alt={featuredFarm.name} className="-mt-9 h-14 w-14 rounded-full border-4 border-white object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="-mt-9 grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-white bg-green-50 text-xs font-bold text-brand-green">Farm</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-brand-navy">{featuredFarm.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} /> {locationText}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                    {badge ? <span className="rounded-full bg-green-50 px-2 py-1 text-brand-green">{badge}</span> : null}
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

      {recommendedListings.length > 0 ? (
        <section className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Recommended Listings</h2>
              <p className="mt-1 text-sm text-slate-600">More marketplace listings worth checking.</p>
            </div>
            <Link href="/marketplace" className="text-sm font-bold text-brand-green">View all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendedListings.map((listing) => (
              <MarketplaceHomeListingCard key={`recommended-${listing.id}`} listing={listing} isSaved={savedListingIds.has(listing.id)} returnPath={returnPath} showDistance={hasLocationContext} />
            ))}
          </div>
        </section>
      ) : null}

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
      <section className="mt-6 grid gap-4 rounded-md border border-green-100 bg-green-50 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-green">Sell and manage from one account</p>
          <h2 className="mt-2 text-2xl font-bold text-brand-navy">Become a seller on AgriMarketX</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-green-950">
            Create listings, receive buyer requests, manage farm records and build trust with seller verification. The mobile app is planned; for now AgriMarketX works in your browser on phone, tablet and desktop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={sellHref as never} className="primary-button">Start Selling</Link>
          <Link href="/farm-management" className="secondary-button bg-white">Farm Management</Link>
          <span className="rounded-md border border-green-200 bg-white px-4 py-2 text-sm font-bold text-brand-green">App coming soon</span>
        </div>
      </section>
      <footer className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
        <div className="flex flex-wrap gap-4">
          <Link href="/help-centre" className="font-semibold hover:text-brand-green">Help Centre</Link>
          <Link href="/safety-advice" className="font-semibold hover:text-brand-green">Safety Advice</Link>
          <Link href="/marketplace-rules" className="font-semibold hover:text-brand-green">Marketplace Rules</Link>
          <Link href="/farm-management" className="font-semibold hover:text-brand-green">Farm Management</Link>
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
      q={q}
      category={category}
      subcategory={subcategory}
      location={hasLocationContext ? (location || resultLocationLabel) : ""}
      latitude={lat}
      longitude={lng}
      radius={selectedRadius}
      locationCounts={locationCountObject}
      listingSuggestions={listingSuggestions}
    >
      {content}
    </MarketplacePageShell>
  );
}
