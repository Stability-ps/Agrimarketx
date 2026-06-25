export const marketplacePrimaryCategories = [
  ["livestock", "Livestock"],
  ["livestock_herds", "Livestock Herds"],
  ["feed_inputs", "Feed & Inputs"],
  ["crops_produce", "Crops / Produce"],
  ["farm_equipment", "Farm Equipment"],
  ["vehicles", "Vehicles"],
  ["infrastructure", "Infrastructure"],
  ["agri_services", "Agri Services"]
] as const;

export type MarketplaceCategory = (typeof marketplacePrimaryCategories)[number][0];

export type MarketplaceSubcategory = {
  label: string;
  slug: string;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type MarketplaceCategoryNode = {
  label: string;
  slug: MarketplaceCategory;
  icon?: string;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
  subcategories: MarketplaceSubcategory[];
};

export const marketplaceCategoryTree: MarketplaceCategoryNode[] = [
  {
    label: "Livestock",
    slug: "livestock",
    icon: "paw",
    active: true,
    seoTitle: "Livestock for Sale in South Africa",
    seoDescription: "Buy and sell cattle, goats, sheep, poultry, pigs, horses and other livestock on AgriMarketX.",
    subcategories: [
      { label: "Cattle", slug: "cattle" },
      { label: "Goats", slug: "goats" },
      { label: "Sheep", slug: "sheep" },
      { label: "Other Livestock", slug: "other_livestock" },
      { label: "Poultry", slug: "poultry" },
      { label: "Pigs", slug: "pigs" },
      { label: "Rabbits", slug: "rabbits" },
      { label: "Horses", slug: "horses" },
      { label: "Game Animals", slug: "game_animals" },
      { label: "Bees & Honey", slug: "bees_honey" },
      { label: "Fish Farming", slug: "fish_farming" },
      { label: "Genetics & Breeding Stock", slug: "genetics_breeding_stock" }
    ]
  },
  {
    label: "Livestock Herds",
    slug: "livestock_herds",
    icon: "users",
    active: true,
    seoTitle: "Livestock Herds for Sale",
    seoDescription: "Find herd lots, breeding groups, dispersal sales and mixed livestock groups.",
    subcategories: [
      { label: "Breeding Herds", slug: "breeding_herds" },
      { label: "Commercial Herds", slug: "commercial_herds" },
      { label: "Stud Herds", slug: "stud_herds" },
      { label: "Mixed Herds", slug: "mixed_herds" },
      { label: "Cattle Herds", slug: "cattle_herds" },
      { label: "Goat Herds", slug: "goat_herds" },
      { label: "Sheep Flocks", slug: "sheep_flocks" },
      { label: "Dispersal Sales", slug: "dispersal_sales" }
    ]
  },
  {
    label: "Feed & Inputs",
    slug: "feed_inputs",
    icon: "package",
    active: true,
    seoTitle: "Feed and Farm Inputs",
    seoDescription: "Shop livestock feed, supplements, seed, fertilizer and animal health inputs.",
    subcategories: [
      { label: "Livestock Feed", slug: "livestock_feed" },
      { label: "Lucerne", slug: "lucerne" },
      { label: "Hay", slug: "hay" },
      { label: "Maize", slug: "maize" },
      { label: "Pellets", slug: "pellets" },
      { label: "Feed Supplements", slug: "feed_supplements" },
      { label: "Animal Health & Medication", slug: "animal_health_medication" },
      { label: "Fertilizers", slug: "fertilizers" },
      { label: "Seeds & Seedlings", slug: "seeds_seedlings" }
    ]
  },
  {
    label: "Crops / Produce",
    slug: "crops_produce",
    icon: "wheat",
    active: true,
    seoTitle: "Crops and Farm Produce",
    seoDescription: "Buy and sell grain, fruit, vegetables, eggs, dairy, honey and farm produce.",
    subcategories: [
      { label: "Grain & Maize", slug: "grain_maize" },
      { label: "Vegetables", slug: "vegetables" },
      { label: "Fruit", slug: "fruit" },
      { label: "Lucerne", slug: "lucerne" },
      { label: "Maize", slug: "maize" },
      { label: "Eggs", slug: "eggs" },
      { label: "Dairy", slug: "dairy" },
      { label: "Honey", slug: "honey" },
      { label: "Fresh Produce", slug: "fresh_produce" }
    ]
  },
  {
    label: "Farm Equipment",
    slug: "farm_equipment",
    icon: "tractor",
    active: true,
    seoTitle: "Farm Equipment and Machinery",
    seoDescription: "Find tractors, implements, dairy equipment, milking systems, tools and processing equipment.",
    subcategories: [
      { label: "Tractors", slug: "tractors" },
      { label: "Implements", slug: "implements" },
      { label: "Ploughs", slug: "ploughs" },
      { label: "Balers", slug: "balers" },
      { label: "Harvesters", slug: "harvesters" },
      { label: "Sprayers", slug: "sprayers" },
      { label: "Irrigation Equipment", slug: "irrigation_equipment" },
      { label: "Feed Mixers", slug: "feed_mixers" },
      { label: "Dairy Equipment", slug: "dairy_equipment" },
      { label: "Milking Systems", slug: "milking_systems" },
      { label: "Processing Equipment", slug: "processing_equipment" },
      { label: "Packaging Equipment", slug: "packaging_equipment" },
      { label: "Workshop Tools", slug: "workshop_tools" },
      { label: "GPS Equipment", slug: "gps_equipment" },
      { label: "Monitoring Devices", slug: "monitoring_devices" }
    ]
  },
  {
    label: "Vehicles",
    slug: "vehicles",
    icon: "car",
    active: true,
    seoTitle: "Farm Vehicles for Sale",
    seoDescription: "Browse bakkies, trucks, trailers and livestock transport vehicles.",
    subcategories: [
      { label: "Cars", slug: "cars" },
      { label: "Bakkies", slug: "bakkies" },
      { label: "Trucks", slug: "trucks" },
      { label: "Trailers", slug: "trailers" },
      { label: "Motorcycles", slug: "motorcycles" },
      { label: "Livestock Trailers", slug: "livestock_trailers" },
      { label: "Utility Vehicles", slug: "utility_vehicles" }
    ]
  },
  {
    label: "Infrastructure",
    slug: "infrastructure",
    icon: "warehouse",
    active: true,
    seoTitle: "Farm Infrastructure",
    seoDescription: "Shop irrigation systems, tanks, fencing, solar, greenhouses, silos and sheds.",
    subcategories: [
      { label: "Irrigation Systems", slug: "irrigation_systems" },
      { label: "Water Tanks", slug: "water_tanks" },
      { label: "Boreholes", slug: "boreholes" },
      { label: "Fencing", slug: "fencing" },
      { label: "Kraals", slug: "kraals" },
      { label: "Solar & Energy", slug: "solar_energy" },
      { label: "Storage & Silos", slug: "storage_silos" },
      { label: "Storage", slug: "storage" },
      { label: "Tunnels", slug: "tunnels" },
      { label: "Greenhouses", slug: "greenhouses" },
      { label: "Farm Buildings", slug: "farm_buildings" },
      { label: "Cattle Crushes", slug: "cattle_crushes" }
    ]
  },
  {
    label: "Agri Services",
    slug: "agri_services",
    icon: "wrench",
    active: true,
    seoTitle: "Agricultural Services",
    seoDescription: "Find veterinary services, livestock transport, farm labour, consulting and mechanisation services.",
    subcategories: [
      { label: "Transport", slug: "transport" },
      { label: "Veterinary", slug: "veterinary" },
      { label: "Breeding Services", slug: "breeding_services" },
      { label: "Shearing", slug: "shearing" },
      { label: "Farm Labour", slug: "farm_labour" },
      { label: "Consulting", slug: "consulting" },
      { label: "Mechanisation Services", slug: "mechanisation_services" },
      { label: "Equipment Hire", slug: "equipment_hire" },
      { label: "Farm Software", slug: "farm_software" },
      { label: "Precision Farming", slug: "precision_farming" },
      { label: "Auctions & Dispersal Sales", slug: "auctions_dispersal_sales" },
      { label: "Farms for Sale", slug: "farms_for_sale" },
      { label: "Farms for Rent", slug: "farms_for_rent" },
      { label: "Agricultural Property", slug: "agricultural_property" }
    ]
  }
];

export const marketplaceCategories = marketplacePrimaryCategories;

const categoryAliases: Record<string, MarketplaceCategory> = {
  feed_nutrition: "feed_inputs",
  crops_seeds: "crops_produce",
  farm_produce: "crops_produce",
  equipment_machinery: "farm_equipment",
  animal_health: "feed_inputs",
  animal_health_products: "feed_inputs",
  services: "agri_services",
  other_agricultural_products: "infrastructure"
};

export function normalizeMarketplaceCategory(category: string | null | undefined): MarketplaceCategory {
  const value = String(category ?? "").trim();
  if (marketplacePrimaryCategories.some(([slug]) => slug === value)) {
    return value as MarketplaceCategory;
  }

  return categoryAliases[value] ?? "livestock";
}

export function marketplaceCategoryLabel(category: string | null | undefined) {
  const normalized = normalizeMarketplaceCategory(category);
  return marketplacePrimaryCategories.find(([value]) => value === normalized)?.[1] ?? "Agricultural product";
}

export function marketplaceSubcategories(category: string | null | undefined) {
  return marketplaceCategoryTree.find((item) => item.slug === normalizeMarketplaceCategory(category))?.subcategories ?? [];
}

export function marketplaceSubcategoryLabel(category: string | null | undefined, subcategory: string | null | undefined) {
  const value = String(subcategory ?? "").trim();
  if (!value) {
    return null;
  }

  return marketplaceSubcategories(category).find((item) => item.slug === value)?.label ?? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function marketplaceCategoryUrl(category: string, subcategory?: string | null) {
  const params = new URLSearchParams({ category: normalizeMarketplaceCategory(category) });
  if (subcategory) {
    params.set("subcategory", subcategory);
  }

  return `/marketplace?${params.toString()}`;
}

export function marketplacePhotoLimit(category: string | null | undefined) {
  const normalized = normalizeMarketplaceCategory(category);
  if (normalized === "vehicles" || normalized === "farm_equipment") {
    return 10;
  }

  if (normalized === "livestock" || normalized === "livestock_herds") {
    return 8;
  }

  if (normalized === "agri_services") {
    return 6;
  }

  return 4;
}

export const marketplaceTitlePlaceholders: Record<MarketplaceCategory, string> = {
  livestock: "e.g. Boer Goat Ram, Dorper Ewe, Bonsmara Bull",
  livestock_herds: "e.g. 30 Boer Goats, 50 Dorper Ewes, Complete Herd Dispersal",
  feed_inputs: "e.g. Lucerne Bales, Goat Feed, Fertilizer, Maize Bran",
  crops_produce: "e.g. Yellow Maize, Fresh Eggs, Potatoes, Tomatoes",
  farm_equipment: "e.g. John Deere Tractor, Feed Mixer, Hammer Mill",
  vehicles: "e.g. Toyota Hilux, Farm Bakkie, Livestock Trailer",
  infrastructure: "e.g. Cattle Crush, Water Tank, Steel Shed, Fencing",
  agri_services: "e.g. Ploughing Service, Livestock Transport, Vet Service"
};

export const marketplaceSearchSynonyms: Record<string, string[]> = {
  car: ["vehicle", "cars", "bakkie", "bakkies", "truck", "trucks", "pickup", "pickups", "van", "trailer", "trailers"],
  cars: ["car", "vehicle", "bakkie", "bakkies", "truck", "pickup", "trailer"],
  bakkie: ["vehicle", "car", "pickup", "truck", "hilux", "gd6"],
  bakkies: ["vehicle", "car", "pickup", "truck", "hilux", "gd6"],
  tractor: ["farm equipment", "machinery", "implements", "implement"],
  tractors: ["farm equipment", "machinery", "implements"],
  goat: ["livestock", "boer goat", "ram", "ewe", "kid", "goats"],
  goats: ["livestock", "boer goat", "ram", "ewe", "kid", "goat"],
  sheep: ["livestock", "ram", "ewe", "lamb"],
  cow: ["cattle", "livestock", "bull", "heifer", "calf"],
  cattle: ["cow", "bull", "heifer", "calf", "livestock"],
  feed: ["lucerne", "maize", "hay", "bales", "pellets", "supplements"],
  crops: ["produce", "vegetables", "maize", "lucerne", "fruit"],
  crop: ["produce", "vegetables", "maize", "lucerne", "fruit"],
  equipment: ["tractor", "implement", "machinery", "plough", "baler"],
  infrastructure: ["kraal", "fencing", "borehole", "tank", "irrigation"],
  services: ["transport", "vet", "veterinary", "shearing", "breeding", "consulting"],
  service: ["transport", "vet", "veterinary", "shearing", "breeding", "consulting"]
};

export const marketplacePopularSearches = [
  "Boer goats",
  "Bakkies",
  "Tractors",
  "Lucerne bales",
  "Cattle",
  "Livestock trailers"
];

export const marketplaceTrendingSearches = [
  "Cars",
  "Goat feed",
  "Dorper sheep",
  "Water tanks",
  "Ploughing service",
  "Fresh eggs"
];

export function expandMarketplaceSearchTerms(query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  const expanded = new Set(terms);

  for (const term of terms) {
    for (const synonym of marketplaceSearchSynonyms[term] ?? []) {
      expanded.add(synonym.toLowerCase());
    }
  }

  return Array.from(expanded);
}

export function marketplaceSuggestionItems() {
  const subcategoryItems = marketplaceCategoryTree.flatMap((category) =>
    category.subcategories
      .filter((subcategory) => !(category.slug === "vehicles" && subcategory.slug === "cars"))
      .map((subcategory) => ({
        label: `${subcategory.label} in ${category.label}`,
        query: subcategory.label,
        category: category.slug,
        subcategory: subcategory.slug
      }))
  );

  return [
    ...marketplacePrimaryCategories.map(([category, label]) => ({
      label,
      query: label,
      category,
      subcategory: null
    })),
    ...subcategoryItems,
    { label: "Cars in Vehicles", query: "Cars", category: "vehicles" as MarketplaceCategory, subcategory: null },
    { label: "Bakkies in Vehicles", query: "Bakkies", category: "vehicles" as MarketplaceCategory, subcategory: "bakkies" },
    { label: "Tractors in Farm Equipment", query: "Tractors", category: "farm_equipment" as MarketplaceCategory, subcategory: "tractors" },
    { label: "Lucerne Bales in Feed & Inputs", query: "Lucerne Bales", category: "feed_inputs" as MarketplaceCategory, subcategory: "lucerne" },
    { label: "Boer Goats in Livestock Herds", query: "Boer Goats", category: "livestock_herds" as MarketplaceCategory, subcategory: "goat_herds" }
  ];
}

export function marketplaceDetailsForCard(details: Record<string, unknown> | null | undefined) {
  if (!details) {
    return [];
  }

  return Object.entries(details)
    .filter(([, value]) => String(value ?? "").trim().length > 0)
    .slice(0, 4)
    .map(([key, value]) => [
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^\w/, (letter) => letter.toUpperCase()),
      String(value)
    ]);
}
