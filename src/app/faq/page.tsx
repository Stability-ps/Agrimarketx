import { MarketingCta, MarketingShell, SectionHeader } from "@/components/marketing/MarketingShell";
import { faqs } from "@/lib/marketing-data";

export default function FaqPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow="Frequently asked questions"
            title="Questions farmers ask before starting."
            description="Clear answers about buying, selling, farm structure, livestock records, marketplace trading, wanted requests, reporting and subscriptions."
          />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="panel p-5">
                <h2 className="font-bold">{faq.question}</h2>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  );
}
