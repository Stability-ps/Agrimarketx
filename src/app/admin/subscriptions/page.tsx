import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, billing_interval, status, current_period_end, subscription_plans(name, price_monthly, price_annual)")
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Subscriptions" description="Monitor Starter, Professional and Enterprise plan records." />
      <AdminNav />
      <div className="grid gap-3">
        {(subscriptions ?? []).map((subscription) => {
          const plan = Array.isArray(subscription.subscription_plans) ? subscription.subscription_plans[0] : subscription.subscription_plans;
          return (
            <section key={subscription.id} className="panel p-4">
              <h3 className="font-bold">{plan?.name ?? "Plan"}</h3>
              <p className="mt-1 text-sm text-slate-600">Status: {subscription.status} · Billing: {subscription.billing_interval}</p>
              <p className="mt-1 text-sm text-slate-600">Current period end: {subscription.current_period_end ?? "Not set"}</p>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
