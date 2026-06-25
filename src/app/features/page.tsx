import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";
import { marketingFeatures, workflowSteps } from "@/lib/marketing-data";

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="AgriMarketX platform features"
            title="Marketplace and farm management features built for African agriculture."
            description="Start with buying and selling, then scale into farms, livestock records, crops, feed, equipment, vehicles, services, roles and reporting."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketingFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="panel p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-brand-green">
                    <Icon size={22} />
                  </div>
                  <h2 className="font-bold">{feature.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-slate-50 px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            title="How the features work together"
            description="AgriMarketX connects marketplace activity, buyer requests, farm structure, animal records, finance and reporting into one workflow."
          />
          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <div key={step} className="panel flex gap-4 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm font-medium text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  );
}
