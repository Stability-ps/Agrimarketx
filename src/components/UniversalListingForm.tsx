"use client";

import { useMemo, useState } from "react";
import {
  marketplaceCategories,
  marketplacePhotoLimit,
  marketplaceSubcategories,
  marketplaceTitlePlaceholders,
  type MarketplaceCategory
} from "@/lib/marketplace-categories";

const categoryFields: Record<MarketplaceCategory, { name: string; label: string; placeholder?: string; type?: string }[]> = {
  livestock: [
    { name: "species", label: "Species", placeholder: "Goats, cattle, sheep" },
    { name: "breed", label: "Breed", placeholder: "Boer, Brahman, Merino" },
    { name: "sex", label: "Sex", placeholder: "Male, female, mixed" },
    { name: "age", label: "Age", placeholder: "8 months, adult, mixed" },
    { name: "weight", label: "Weight", placeholder: "Approx. 45 kg" },
    { name: "quantity", label: "Quantity", placeholder: "1 animal" }
  ],
  livestock_herds: [
    { name: "species", label: "Species", placeholder: "Goats, cattle, sheep" },
    { name: "breed", label: "Breed", placeholder: "Boer, Bonsmara, Dorper" },
    { name: "countBreakdown", label: "Animal count breakdown", placeholder: "20 does, 2 bucks, 8 kids" },
    { name: "ageRange", label: "Age range", placeholder: "Mixed ages" },
    { name: "pricePerHead", label: "Price per head", placeholder: "e.g. R2 500 per head" }
  ],
  feed_inputs: [
    { name: "feedType", label: "Feed / input type", placeholder: "Lucerne, pellets, fertilizer" },
    { name: "quantity", label: "Quantity available", placeholder: "50 bags, 2 tons" },
    { name: "weightPerUnit", label: "Bag size / unit", placeholder: "40 kg bag" },
    { name: "protein", label: "Protein / nutrition", placeholder: "18% protein" },
    { name: "expiryDate", label: "Expiry date", type: "date" }
  ],
  crops_produce: [
    { name: "produceType", label: "Crop / produce type", placeholder: "Maize, eggs, potatoes" },
    { name: "quantity", label: "Quantity", placeholder: "30 trays, 10 tons" },
    { name: "grade", label: "Grade / quality", placeholder: "Grade A, organic" },
    { name: "harvestDate", label: "Harvest / production date", type: "date" },
    { name: "delivery", label: "Delivery availability", placeholder: "Collection, delivery available" }
  ],
  farm_equipment: [
    { name: "equipmentType", label: "Equipment type", placeholder: "Tractor, trailer, hammer mill" },
    { name: "brand", label: "Brand", placeholder: "John Deere, Massey Ferguson" },
    { name: "model", label: "Model / year", placeholder: "Model and year" },
    { name: "condition", label: "Condition", placeholder: "New, used, needs repair" },
    { name: "hoursUsed", label: "Hours used", placeholder: "1,200 hours" },
    { name: "horsepower", label: "Horsepower", placeholder: "120 HP" }
  ],
  vehicles: [
    { name: "vehicleType", label: "Vehicle type", placeholder: "Bakkie, truck, livestock trailer" },
    { name: "brand", label: "Brand", placeholder: "Toyota, Ford, Isuzu" },
    { name: "model", label: "Model / year", placeholder: "2021 Hilux 2.4 GD-6" },
    { name: "kilometres", label: "Kilometres", placeholder: "98 000 km" },
    { name: "transmission", label: "Transmission", placeholder: "Manual, automatic" },
    { name: "condition", label: "Condition", placeholder: "Excellent, used, needs repair" }
  ],
  infrastructure: [
    { name: "productType", label: "Infrastructure type", placeholder: "Cattle crush, water tank, fencing" },
    { name: "size", label: "Size / dimensions", placeholder: "6m x 12m, 5000L" },
    { name: "condition", label: "Condition", placeholder: "New, used" },
    { name: "material", label: "Material", placeholder: "Steel, plastic, wood" },
    { name: "specifications", label: "Specifications", placeholder: "Capacity, length, included parts" }
  ],
  agri_services: [
    { name: "serviceType", label: "Service type", placeholder: "Transport, vet, ploughing" },
    { name: "coverageArea", label: "Coverage area", placeholder: "Limpopo, Gauteng" },
    { name: "availability", label: "Availability", placeholder: "Weekdays, weekends" },
    { name: "serviceUnit", label: "Service unit", placeholder: "Per trip, per hectare, per hour" },
    { name: "experience", label: "Experience", placeholder: "10 years, registered vet" }
  ]
};

export function UniversalListingForm() {
  const [category, setCategory] = useState<MarketplaceCategory>("livestock");
  const subcategories = useMemo(() => marketplaceSubcategories(category), [category]);
  const fields = categoryFields[category];
  const photoLimit = marketplacePhotoLimit(category);

  return (
    <>
      <label>
        <span className="text-sm font-semibold">Category</span>
        <select className="field mt-1" name="category" value={category} onChange={(event) => setCategory(event.target.value as MarketplaceCategory)}>
          {marketplaceCategories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-sm font-semibold">Subcategory</span>
        <select className="field mt-1" name="subcategory" key={category} defaultValue="" required>
          <option value="">Choose subcategory</option>
          {subcategories.map((subcategory) => (
            <option key={subcategory.slug} value={subcategory.slug}>{subcategory.label}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="text-sm font-semibold">Listing title</span>
        <input className="field mt-1" name="title" placeholder={marketplaceTitlePlaceholders[category]} required />
      </label>
      {fields.map((field) => (
        <label key={field.name}>
          <span className="text-sm font-semibold">{field.label}</span>
          <input className="field mt-1" name={`detail_${field.name}`} type={field.type ?? "text"} placeholder={field.placeholder} />
        </label>
      ))}
      <div className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4">
        <h3 className="font-bold">Photos</h3>
        <p className="mt-1 text-sm text-slate-600">
          Upload up to {photoLimit} photos for this category. You can select more than one photo at the same time.
        </p>
      </div>
      <label className="sm:col-span-2">
        <span className="text-sm font-semibold">Listing photos</span>
        <input className="field mt-1" type="file" name="listingPhotos" accept="image/*" multiple />
        <span className="mt-1 block text-xs text-slate-500">On desktop, hold Command while choosing photos if you need to select several.</span>
      </label>
    </>
  );
}
