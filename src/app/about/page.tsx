import type { Metadata } from "next";
import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "About AgriMarketX",
  description: "Learn about AgriMarketX, Africa's agricultural marketplace and farm management platform for farmers, buyers and sellers."
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="About AgriMarketX"
            title="Built for agricultural trade, farm records and better decisions."
            description="AgriMarketX is shaped for farmers, buyers and sellers who need practical records, public marketplace discovery, wanted requests, verification and safer agricultural trade."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Manage", "Structure farms, livestock records, products, services, finance and reports."],
              ["Track", "Follow animal history, marketplace activity, buyer requests, documents and decisions."],
              ["Trade", "List agricultural products, manage enquiries, protect location privacy and support verified sellers."]
            ].map(([title, description]) => (
              <div key={title} className="panel p-5">
                <h2 className="text-xl font-bold text-brand-green">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  );
}
