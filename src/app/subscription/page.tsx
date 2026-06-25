import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { subscriptionPlans } from "@/lib/mock-data";

export default async function SubscriptionPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <AppShell>
      <PageHeader
        title="Subscription"
        description="Stripe-ready monthly and annual plans with animal limits and feature limits."
      />
      {message ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <div key={plan.name} className="panel p-5">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-3 text-3xl font-bold text-brand-green">{plan.price}</p>
            <p className="mt-3 text-sm font-semibold">{plan.animals}</p>
            <p className="mt-2 text-sm text-slate-600">{plan.features}</p>
            <Link
              href={`/subscription?message=${encodeURIComponent(`${plan.name} checkout is ready for Stripe connection next.`)}`}
              className="primary-button mt-5 w-full"
            >
              Choose plan
            </Link>
          </div>
        ))}
      </div>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">Billing controls</h3>
        <p className="mt-2 text-sm text-slate-600">Checkout and customer portal routes are ready to connect to Stripe server actions.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/subscription?message=Monthly billing selected." className="secondary-button">Monthly billing</Link>
          <Link href="/subscription?message=Annual billing selected." className="secondary-button">Annual billing</Link>
          <Link href="/subscription?message=Stripe customer portal will open here once Stripe keys are connected." className="secondary-button">Open customer portal</Link>
        </div>
      </section>
    </AppShell>
  );
}
