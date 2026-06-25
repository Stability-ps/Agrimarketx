import { AppShell, PageHeader } from "@/components/AppShell";

const tips = [
  ["Avoid paying deposits before inspection", "Do not send a deposit just because a seller says many people are interested. First confirm the animal, product, farm profile and seller details. Use written messages so there is a record."],
  ["Meet in a safe place", "Choose a public or known farm location during daylight. Tell someone where you are going and avoid carrying large cash amounts if you do not know the seller."],
  ["Verify seller profile", "Look for a completed farm profile, verified seller badge, clear listings and consistent contact details. Be cautious if the seller avoids questions or rushes payment."],
  ["Check animal health records", "Ask for vaccination, treatment, breeding and movement history where available. For livestock, inspect condition, tag numbers and any passport details before agreeing to buy."],
  ["Report suspicious listings", "Report listings that look fake, use stolen photos, show unrealistic prices, or ask you to communicate away from AgriMarketX immediately."],
  ["Be careful with transport scams", "Confirm who is arranging transport, what it costs, who owns the animal during transit, and when responsibility transfers. Avoid paying unknown transporters upfront."]
] as const;

export default function SafetyAdvicePage() {
  return (
    <AppShell>
      <PageHeader title="Safety Advice" description="Simple safety tips for buying and selling on AgriMarketX." />
      <div className="mx-auto grid max-w-2xl gap-3">
        {tips.map(([title, body]) => (
          <section key={title} className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
