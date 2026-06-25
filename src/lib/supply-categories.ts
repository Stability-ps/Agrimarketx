import { marketplaceCategories, marketplaceCategoryLabel, normalizeMarketplaceCategory } from "./marketplace-categories";

export const supplyCategories = [
  ["all", "All"],
  ...marketplaceCategories
] as const;

export type SupplyCategory = (typeof supplyCategories)[number][0];

export function supplyCategoryLabel(category: string | null | undefined) {
  if (category === "all") {
    return "All";
  }

  return marketplaceCategoryLabel(category);
}

export function normalizeSupplyCategories(values: FormDataEntryValue[] | string[] | null | undefined) {
  const rawValues = values ?? [];
  const normalized = rawValues
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .map((value) => value === "all" ? "all" : normalizeMarketplaceCategory(value));

  if (normalized.includes("all")) {
    return ["all"];
  }

  return Array.from(new Set(normalized));
}
