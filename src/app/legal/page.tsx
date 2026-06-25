import type { Metadata } from "next";
import { MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Legal | AgriMarketX",
  description: "Public AgriMarketX legal information including terms, privacy, POPIA, cookie policy and disclaimer."
};

const sections = [
  ["Terms of Service", "AgriMarketX provides farm management and marketplace tools. Users must provide accurate information and use the platform lawfully."],
  ["Privacy Policy", "Public listings show only marketplace information. Private farm records, GPS details and personal data should remain protected unless shared by the owner."],
  ["POPIA Compliance", "AgriMarketX aims to handle personal information responsibly and only for platform, safety, support and operational purposes."],
  ["Cookie Policy", "The platform may use cookies for login sessions, preferences, security and basic product improvement."],
  ["Disclaimer", "AgriMarketX does not guarantee animal condition, fertility, ownership, transport outcomes or seller performance. Buyers must inspect and verify before purchase."]
] as const;

export default function PublicLegalPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="Legal" title="AgriMarketX legal information." description="Plain-language platform terms, privacy notes and marketplace disclaimers." />
          <div className="grid gap-3">
            {sections.map(([title, body]) => (
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
