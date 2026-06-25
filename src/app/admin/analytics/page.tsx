import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";

export default function AdminAnalyticsPage() {
  return (
    <AppShell>
      <PageHeader title="Analytics" description="Platform analytics placeholder for marketplace growth, users, listings and seller activity." />
      <AdminNav />
      <section className="panel p-5 text-sm text-slate-600">Analytics charts will appear here as marketplace traffic grows.</section>
    </AppShell>
  );
}
