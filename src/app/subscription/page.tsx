import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function SubscriptionPage() {
  return (
    <AppShell>
      <PageHeader
        title="Subscription & Billing"
        description="Billing is not currently enabled in AgriMarketX."
      />
      <section className="panel mx-auto max-w-2xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-navy">No payment is required in the app right now</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          AgriMarketX is currently available without in-app subscription checkout. We will only show plan selection,
          checkout and billing-portal controls after the payment service is fully connected and tested.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/marketplace" className="primary-button">Go to Marketplace</Link>
          <Link href="/contact" className="secondary-button">Contact support</Link>
        </div>
      </section>
    </AppShell>
  );
}
