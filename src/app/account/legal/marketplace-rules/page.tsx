import { AppShell, PageHeader } from "@/components/AppShell";

const rules = [
  ["General listing rules", "Listings must be honest, clear and placed in the correct category. Use your own photos, a fair description, a real price, and an approximate public location. Do not list anything you do not own or have authority to sell."],
  ["Livestock listing rules", "Livestock listings must come from recorded animals inside AgriMarketX. Sellers should include species, breed, age, sex, weight where known, health records where available, and any important movement or ownership information."],
  ["Food and produce rules", "Food, crops, seeds and produce must show quantity, freshness, packaging, grade and expiry or harvest information where relevant. Unsafe, expired or misleading produce listings may be removed."],
  ["Equipment and machinery rules", "Equipment listings should include brand, model, condition, hours used, kilometres for vehicles, defects, included parts and whether documents are available."],
  ["Services rules", "Service providers must describe the service clearly, list service areas, availability, experience and any qualifications where relevant."],
  ["Prohibited items", "No stolen animals or goods, fake listings, unsafe medicine, illegal products, misleading photos, bait pricing, offensive content or products that may harm buyers, animals or farms."]
];

export default function MarketplaceRulesPage() {
  return (
    <AppShell>
      <PageHeader title="Marketplace Rules" description="Short rules to keep AgriMarketX safe and useful." />
      <div className="mx-auto grid max-w-2xl gap-3">
        {rules.map(([title, text]) => (
          <section key={title} className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
