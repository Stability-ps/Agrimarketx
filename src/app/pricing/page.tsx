import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";
import { pricingPlans } from "@/lib/marketing-data";

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Simple agricultural platform pricing"
            title="Start lean, then scale as your marketplace and farm activity grows."
            description="AgriMarketX plans are designed around farm tools, marketplace access, animal records, feature access and monthly or annual billing."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article key={plan.name} className={`panel p-6 ${plan.featured ? "border-brand-green ring-2 ring-green-100" : ""}`}>
                {plan.featured ? <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">Most popular</span> : null}
                <h2 className="mt-4 text-2xl font-bold">{plan.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                <p className="mt-5 text-4xl font-bold text-brand-green">
                  {plan.price}
                  <span className="text-base font-semibold text-slate-500">{plan.period}</span>
                </p>
                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className="shrink-0 text-brand-green" size={19} />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/onboarding" className="primary-button mt-6 w-full">
                  Start Trial
                </Link>
              </article>
            ))}
          </div>
          <div className="panel mt-8 p-5">
            <h2 className="font-bold">Pricing calculator coming next</h2>
            <p className="mt-2 text-sm text-slate-600">
              A useful next step is a simple calculator for farms, animals, marketplace volume and annual billing savings.
            </p>
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  );
}
