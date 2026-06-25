import type { Metadata } from "next";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Marketplace Rules | AgriMarketX",
  description: "AgriMarketX public marketplace rules for listings, prohibited items, fraud, animal welfare and account suspension."
};

const rules = [
  ["Listing requirements", "Listings must use honest titles, real photos, accurate categories, Rand prices and approximate public locations."],
  ["Prohibited items", "Do not list stolen goods, illegal products, unsafe medicines, restricted wildlife, fake documents or misleading services."],
  ["Fraud policy", "Fake listings, stolen photos, bait pricing and payment scams can lead to removal or account suspension."],
  ["Animal welfare standards", "Livestock listings should be truthful about animal condition, age, health records and movement readiness."],
  ["Reporting abuse", "Visitors can report suspicious listings, offensive content, wrong categories or suspicious sellers."],
  ["Account suspension", "AgriMarketX may suspend sellers or remove listings when safety, fraud or compliance risks are found."]
] as const;

export default function PublicMarketplaceRulesPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="Marketplace Rules" title="Clear rules for safer agricultural trade." description="These rules keep AgriMarketX useful for buyers, farmers and verified sellers." />
          <div className="grid gap-3">
            {rules.map(([title, body]) => (
              <section key={title} className="panel p-4">
                <h2 className="font-bold text-brand-navy">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
