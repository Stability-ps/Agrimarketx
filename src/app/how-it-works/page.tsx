import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Search, ShieldCheck, Store, UserPlus } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "How AgriMarketX Works | Agricultural Marketplace",
  description:
    "Learn how AgriMarketX helps buyers, farmers and agricultural businesses create accounts, post listings, search by category and location, contact sellers and complete private deals safely."
};

const steps = [
  {
    title: "Create an Account",
    icon: UserPlus,
    points: ["Register as a farmer, buyer or agricultural business.", "Create your farm or buyer profile.", "Verify your account when you are ready to sell."]
  },
  {
    title: "Post Your Listing",
    icon: Store,
    points: [
      "Sell livestock, herds, feed, crops, equipment, vehicles, infrastructure and agricultural services.",
      "Upload clear photos, add a description, set your location and choose your preferred contact method.",
      "Publish your listing once the key details are complete."
    ]
  },
  {
    title: "Buyers Discover Your Listing",
    icon: Search,
    points: ["Buyers search by keywords, categories, breeds, location, equipment type and filters.", "Your listing becomes visible across the marketplace after approval."]
  },
  {
    title: "Contact Seller",
    icon: MessageCircle,
    points: ["Interested buyers click Contact Seller on the listing detail page.", "Seller details stay hidden until the buyer chooses to contact.", "Communication can happen through in-app messaging, WhatsApp, phone or email depending on seller preference."]
  },
  {
    title: "Complete the Deal",
    icon: CheckCircle2,
    points: ["Buyer and seller agree on price, delivery, collection and inspection.", "AgriMarketX connects buyers and sellers but does not interfere with private negotiations."]
  }
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <section className="bg-[linear-gradient(135deg,#052e16,#0f172a)] px-4 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-green-100">
            <ShieldCheck size={16} />
            Trusted agricultural marketplace
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">How AgriMarketX Works</h1>
          <p className="mt-4 max-w-3xl text-base text-green-50 sm:text-lg">
            Africa’s trusted agricultural marketplace for buying, selling and managing livestock, equipment, crops and agricultural services.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/marketplace" className="primary-button bg-white text-brand-navy hover:bg-slate-100">
              Start Buying
            </Link>
            <Link href="/marketplace/create" className="secondary-button border-white/40 bg-white/10 text-white hover:border-white hover:text-white">
              Sell Your Item
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="panel grid gap-4 p-5 sm:grid-cols-[auto_1fr]">
                <div className="flex items-center gap-3 sm:block">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-brand-green">
                    <Icon size={24} />
                  </span>
                  <p className="text-sm font-bold uppercase tracking-wide text-brand-green sm:mt-3">Step {index + 1}</p>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">{step.title}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    {step.points.map((point) => (
                      <p key={point} className="rounded-md bg-slate-50 p-3">{point}</p>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
