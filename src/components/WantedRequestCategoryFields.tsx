"use client";

import { useMemo, useState } from "react";
import { marketplaceCategories, marketplaceSubcategories, type MarketplaceCategory } from "@/lib/marketplace-categories";

export function WantedRequestCategoryFields() {
  const [category, setCategory] = useState<MarketplaceCategory>("livestock");
  const subcategories = useMemo(() => marketplaceSubcategories(category), [category]);

  return (
    <>
      <select className="field" name="category" value={category} onChange={(event) => setCategory(event.target.value as MarketplaceCategory)}>
        {marketplaceCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className="field" name="subcategory" key={category} defaultValue="" required>
        <option value="">Choose subcategory</option>
        {subcategories.map((subcategory) => (
          <option key={subcategory.slug} value={subcategory.slug}>{subcategory.label}</option>
        ))}
      </select>
    </>
  );
}
