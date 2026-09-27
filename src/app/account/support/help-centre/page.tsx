import { AppShell, PageHeader } from "@/components/AppShell";

const categories = [
  ["Getting Started", ["Create your first farm", "Add your first animal"]],
  ["Livestock Management", ["Animal IDs and tags", "Weight records"]],
  ["Animal Health", ["Vaccination reminders", "Herd health records"]],
  ["Marketplace", ["Browse listings", "Contact a seller"]],
  ["Selling Products", ["Create a listing", "Listing photos"]],
  ["Farm Management", ["Switch farms", "Edit farm details"]],
  ["QR Tags", ["Animal passport QR codes", "Public passport view"]],
  ["Safety", ["Avoid scams", "Report suspicious listings"]],
  ["Account & Support", ["Account settings", "Contact support"]]
] as const;

export default function HelpCentrePage() {
  return (
    <AppShell>
      <PageHeader title="Help Centre" description="Find simple help articles for AgriMarketX." />
      <div className="mx-auto max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map(([category, articles]) => (
            <section key={category} className="rounded-md border border-slate-200 bg-white p-4">
              <h3 className="font-bold">{category}</h3>
              <div className="mt-3 grid gap-2">
                {articles.map((article) => (
                  <div key={article} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">{article}</div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
