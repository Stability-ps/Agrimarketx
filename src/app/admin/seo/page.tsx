import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";

export default function AdminSeoPage() {
  return (
    <AppShell>
      <PageHeader title="SEO Management" description="Manage province pages, city pages, category pages and search visibility." />
      <AdminNav />
      <section className="panel p-5 text-sm text-slate-600">SEO location and category controls will be managed here.</section>
    </AppShell>
  );
}
