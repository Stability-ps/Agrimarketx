import {
  expandMarketplaceSearchTerms,
  marketplaceCategoryLabel,
  marketplaceCategoryTree,
  marketplaceSearchSynonyms,
  marketplaceSuggestionItems,
  normalizeMarketplaceCategory,
  type MarketplaceCategory
} from "@/lib/marketplace-categories";
import type { MarketplaceLocationItem } from "@/lib/provinces";

export type MarketplaceSuggestionKind = "category" | "location" | "combined" | "listing";

export type MarketplaceListingSuggestion = {
  id: string;
  title: string | null;
  category: string | null;
  subcategory?: string | null;
  province?: string | null;
  town?: string | null;
  approximate_location?: string | null;
};

export type MarketplaceSearchSuggestion = {
  label: string;
  query: string;
  category?: MarketplaceCategory;
  subcategory?: string | null;
  count?: number;
  kind: MarketplaceSuggestionKind;
};

type BuildSuggestionsOptions = {
  query: string;
  currentCategory?: string;
  locations: MarketplaceLocationItem[];
  locationCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  listingSuggestions?: MarketplaceListingSuggestion[];
  includeCounts?: boolean;
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryCountKey(category: string | null | undefined, subcategory?: string | null) {
  return `${category ?? ""}::${subcategory ?? ""}`;
}

function countForLocation(location: MarketplaceLocationItem, locationCounts: Record<string, number>) {
  if (location.type === "province") {
    return locationCounts[location.province.toLowerCase()] ?? 0;
  }

  return locationCounts[`${String(location.town).toLowerCase()}::${location.province.toLowerCase()}`] ?? 0;
}

function labelWithCount(label: string, count: number | undefined, includeCounts: boolean) {
  if (!includeCounts || !count) {
    return label;
  }

  return `${label} (${count})`;
}

function searchTerms(query: string) {
  const cleanQuery = normalizeSearchText(query);
  if (!cleanQuery) {
    return [];
  }

  return Array.from(new Set([cleanQuery, ...expandMarketplaceSearchTerms(cleanQuery).map(normalizeSearchText)])).filter(Boolean);
}

function matchesSearch(value: string, terms: string[]) {
  const text = normalizeSearchText(value);
  if (!text || terms.length === 0) {
    return false;
  }

  return terms.some((term) => text.includes(term) || term.includes(text));
}

export function buildMarketplaceSearchSuggestions({
  query,
  currentCategory = "all",
  locations,
  locationCounts = {},
  categoryCounts = {},
  listingSuggestions = [],
  includeCounts = false
}: BuildSuggestionsOptions) {
  const terms = searchTerms(query);
  const categoryPriority = currentCategory !== "all";
  const normalizedCurrentCategory = categoryPriority ? normalizeMarketplaceCategory(currentCategory) : "all";

  if (terms.length === 0) {
    return marketplaceSuggestionItems()
      .filter((item) => !categoryPriority || item.category === normalizedCurrentCategory)
      .slice(0, 10)
      .map<MarketplaceSearchSuggestion>((item) => ({
        ...item,
        label: labelWithCount(item.label, categoryCounts[categoryCountKey(item.category, item.subcategory)], includeCounts),
        count: categoryCounts[categoryCountKey(item.category, item.subcategory)] ?? categoryCounts[categoryCountKey(item.category)] ?? 0,
        kind: "category"
      }));
  }

  const categoryMatches = marketplaceSuggestionItems()
    .map<MarketplaceSearchSuggestion>((item) => ({
      ...item,
      label: labelWithCount(item.label, categoryCounts[categoryCountKey(item.category, item.subcategory)] ?? categoryCounts[categoryCountKey(item.category)], includeCounts),
      count: categoryCounts[categoryCountKey(item.category, item.subcategory)] ?? categoryCounts[categoryCountKey(item.category)] ?? 0,
      kind: "category"
    }))
    .filter((item) => {
      if (categoryPriority && item.category !== normalizedCurrentCategory) {
        return false;
      }

      return matchesSearch(`${item.label} ${item.query} ${item.category ?? ""} ${item.subcategory ?? ""}`, terms);
    })
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  const locationMatches = locations
    .map((location) => ({
      location,
      count: countForLocation(location, locationCounts)
    }))
    .filter(({ location }) => matchesSearch(`${location.label} ${location.query} ${location.aliases.join(" ")}`, terms))
    .sort((a, b) => b.count - a.count || Number(a.location.type === "town") - Number(b.location.type === "town"))
    .slice(0, 5)
    .map<MarketplaceSearchSuggestion>(({ location, count }) => ({
      label: labelWithCount(location.label, count, includeCounts),
      query: location.query,
      count,
      kind: "location"
    }));

  const listingMatches = listingSuggestions
    .filter((listing) =>
      matchesSearch(
        [
          listing.title,
          listing.category,
          marketplaceCategoryLabel(listing.category),
          listing.subcategory,
          listing.province,
          listing.town,
          listing.approximate_location
        ].filter(Boolean).join(" "),
        terms
      )
    )
    .slice(0, 5)
    .map<MarketplaceSearchSuggestion>((listing) => ({
      label: listing.title ?? "Marketplace listing",
      query: listing.title ?? query,
      category: listing.category ? normalizeMarketplaceCategory(listing.category) : undefined,
      subcategory: listing.subcategory,
      kind: "listing"
    }));

  const bestLocation = locationMatches[0];
  const combinedSuggestions = bestLocation
    ? categoryMatches
        .slice(0, 4)
        .map<MarketplaceSearchSuggestion>((item) => ({
          label: `${item.query} in ${bestLocation.label.replace(/\s+\(\d+\)$/, "")}`,
          query: `${item.query} ${bestLocation.query}`,
          category: item.category,
          subcategory: item.subcategory,
          count: bestLocation.count,
          kind: "combined"
        }))
    : [];

  const merged = [...combinedSuggestions, ...categoryMatches, ...listingMatches, ...locationMatches];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      const key = `${item.kind}-${item.category ?? ""}-${item.subcategory ?? ""}-${item.query.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

export function marketplaceSuggestionHref(item: MarketplaceSearchSuggestion, currentCategory = "all") {
  const params = new URLSearchParams();
  params.set("q", item.query);
  if (item.category) {
    params.set("category", item.category);
  } else if (currentCategory !== "all") {
    params.set("category", normalizeMarketplaceCategory(currentCategory));
  }
  if (item.subcategory) {
    params.set("subcategory", item.subcategory);
  }

  return `/marketplace?${params.toString()}`;
}

export function relatedMarketplaceCategories(query: string) {
  const terms = searchTerms(query);
  if (terms.length === 0) {
    return [];
  }

  const categoryHints: Record<MarketplaceCategory, string[]> = {
    livestock: ["livestock", "goat", "goats", "boer goat", "sheep", "cow", "cattle", "bull", "ewe", "ram", "poultry", "pig"],
    livestock_herds: ["herd", "herds", "flock", "flocks", "group", "dispersal"],
    feed_inputs: ["feed", "food", "lucerne", "lucern", "hay", "bales", "pellets", "supplements", "fertilizer", "fertiliser"],
    crops_produce: ["crop", "crops", "produce", "vegetable", "fruit", "maize", "eggs", "honey"],
    farm_equipment: ["tractor", "tractors", "equipment", "machinery", "implement", "plough", "baler", "harvester"],
    vehicles: ["car", "cars", "vehicle", "vehicles", "bakkie", "bakkies", "truck", "trucks", "pickup", "trailer", "trailers", "tractor"],
    infrastructure: ["infrastructure", "tank", "fencing", "borehole", "irrigation", "shed", "kraal", "greenhouse"],
    agri_services: ["service", "services", "transport", "vet", "veterinary", "labour", "consulting", "ploughing"]
  };
  const feedIntent = terms.some((term) => ["feed", "food", "lucern", "lucerne", "hay", "bales", "pellets", "supplements"].includes(term));

  const matches = marketplaceCategoryTree
    .filter((category) => {
      const haystack = [
        category.label,
        category.slug,
        ...(categoryHints[category.slug] ?? []),
        ...category.subcategories.flatMap((item) => [item.label, item.slug])
      ].join(" ");

      return matchesSearch(haystack, terms);
    })
    .map((category) => ({
      category: category.slug,
      label: category.label
    }));

  if (feedIntent && matches.some((item) => item.category === "feed_inputs")) {
    return matches.filter((item) => item.category === "feed_inputs");
  }

  return matches;
}

export function hasSearchSynonym(term: string) {
  const cleanTerm = normalizeSearchText(term);
  return Boolean(marketplaceSearchSynonyms[cleanTerm]);
}
