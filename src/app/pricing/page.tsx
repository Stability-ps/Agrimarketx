import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

// Billing is not enabled. This page must not show priced plans, trials or
// checkout until a real, tested payment integration exists.
const includedFeatures = [
  "Buy and sell on the marketplace",
  "Farm, animal, health, breeding and finance records",
  "Seller verification and trust badges",
  "Messages, enquiries, offers and wanted requests"
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            eyebrow="Pricing"
            title="AgriMarketX is currently free to use."
            description="There are no subscription fees or payments in the app right now. If paid plans are introduced, we will tell you in advance and nothing will be charged without your agreement."
          />
          <article className="panel p-6">
            <h2 className="text-xl font-bold">Included for everyone</h2>
            <div className="mt-4 space-y-3">
              {includedFeatures.map((item) => (
                <div key={item} className="flex gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="shrink-0 text-brand-green" size={19} />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/signup" className="primary-button mt-6 w-full">
              Create a free account
            </Link>
          </article>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  );
}
