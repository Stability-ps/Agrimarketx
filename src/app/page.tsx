import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";
import { calculatorFeature, highlightStats, marketingFeatures, workflowSteps } from "@/lib/marketing-data";

export default function HomePage() {
  const CalculatorIcon = calculatorFeature.icon;

  return (
    <MarketingShell>
      <section className="px-4 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              {["Marketplace Ready", "Farm Management", "Buyer & Seller Network", "Digital Records", "Verified Sellers", "Wanted Listings"].map((item) => (
                <span key={item} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-brand-green">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green">Agricultural Marketplace & Farm Management Platform</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
              Buy, Sell, Manage and Grow Your Agricultural Business.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              AgriMarketX combines farm management, livestock records, agricultural trading, supplier discovery, wanted requests, verification and digital farm tools into one powerful platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/onboarding" className="primary-button gap-2">
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <Link href="/pricing" className="secondary-button">
                View Pricing
              </Link>
              <Link href="/features" className="secondary-button">
                Explore Features
              </Link>
            </div>
          </div>
          <div className="panel overflow-hidden">
            <div className="bg-slate-50 p-5">
              <img src="/agrimarketx-logo.png" alt="AgriMarketX agricultural marketplace platform" className="mx-auto h-auto w-80 max-w-full" />
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {highlightStats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-3xl font-bold text-brand-green">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Built around real agricultural decisions"
            title="Everything a modern agricultural business manages daily."
            description="AgriMarketX is organised around practical workflows: know what you manage, what is listed, what needs attention and where buyers or sellers are waiting."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketingFeatures.slice(0, 6).map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="panel p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-brand-green">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green">Daily workflow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">A simple rhythm for farm and marketplace work.</h2>
            <p className="mt-3 text-slate-600">
              The public site should show farmers exactly how the platform helps them work each day, not just list software modules.
            </p>
          </div>
          <div className="space-y-3">
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

      <section className="bg-green-50 px-4 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="panel p-6">
            <CalculatorIcon className="text-brand-green" size={34} />
            <h2 className="mt-4 text-2xl font-bold">{calculatorFeature.title}</h2>
            <p className="mt-3 text-slate-600">{calculatorFeature.description}</p>
          </div>
          <div className="panel p-6">
            <h2 className="text-2xl font-bold">Why AgriMarketX can stand apart</h2>
            <div className="mt-4 space-y-3">
              {["Marketplace listings across agricultural categories", "Controlled public location display", "Wanted requests and seller matching", "Digital records and livestock passports"].map((item) => (
                <div key={item} className="flex gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="shrink-0 text-brand-green" size={20} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  );
}
