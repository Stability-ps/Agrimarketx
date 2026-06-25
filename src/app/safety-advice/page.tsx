import type { Metadata } from "next";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Safety Advice | AgriMarketX",
  description: "Safety advice for livestock purchases, farm visits, scam prevention and animal transfer verification on AgriMarketX."
};

const tips = [
  ["Safe livestock purchases", "Inspect animals in person where possible, compare tags, check health records and confirm ownership before paying."],
  ["Farm visits", "Meet during daylight, tell someone where you are going, and avoid carrying large amounts of cash."],
  ["Scam prevention", "Be careful with unrealistic prices, stolen photos, pressure to pay deposits and sellers who avoid direct questions."],
  ["Buyer protection", "Keep messages, photos, invoices and transfer agreements. Do not rely only on verbal promises."],
  ["Seller protection", "Confirm buyer identity, agree collection or transport clearly, and mark listings sold when complete."],
  ["Animal transfer verification", "Check the animal passport, vaccination records, ownership history and transfer status before handover."]
] as const;

export default function PublicSafetyAdvicePage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="Safety Advice" title="Trade carefully and keep records clear." description="Short guidance for safer livestock, farm product and equipment trade." />
          <div className="grid gap-3">
            {tips.map(([title, body]) => (
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
