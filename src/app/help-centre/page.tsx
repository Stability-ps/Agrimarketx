import type { Metadata } from "next";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Help Centre | AgriMarketX",
  description: "Public AgriMarketX help articles for buying, selling, wanted listings, verification, transfers and account management."
};

const sections = [
  ["Buying", ["Search by category, province or town.", "Open a listing detail page before contacting a seller.", "Save listings so you can compare them later."]],
  ["Selling", ["Create listings from your seller account.", "Use clear photos, honest prices and an approximate public location.", "Livestock listings must come from recorded animals."]],
  ["Wanted Listings", ["Tell sellers what you need.", "Requests are reviewed before being published.", "Verified sellers can respond with quotes."]],
  ["Verification", ["Verified sellers show a trust badge.", "Farm and seller details may be reviewed by admin.", "Keep your profile and contact details current."]],
  ["Animal Transfers", ["Confirm animal identity and history before transfer.", "Keep ownership records attached to the animal passport.", "Use buyer and seller confirmations."]],
  ["Payments", ["AgriMarketX does not provide checkout, wallet or escrow yet.", "Inspect items and agree payment safely with the seller."]],
  ["Account Management", ["Use Account Settings for profile, phone, WhatsApp and preferences.", "Buyers can become sellers by setting up a farm profile."]]
] as const;

export default function PublicHelpCentrePage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeader eyebrow="Help Centre" title="Simple help for buying, selling and managing farm trade." description="Find quick answers before creating an account or contacting support." />
          <input className="field mb-5" placeholder="Search help articles" />
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map(([title, points]) => (
              <section key={title} className="panel p-4">
                <h2 className="font-bold text-brand-navy">{title}</h2>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  {points.map((point) => <p key={point} className="rounded-md bg-slate-50 p-3">{point}</p>)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
