import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";

const reports = [
  { name: "Animal register", href: "/animals", source: "animals" },
  { name: "Animal detail report", href: "/animals", source: "animals" },
  { name: "Health report", href: "/health", source: "health" },
  { name: "Treatment report", href: "/health", source: "health" },
  { name: "Vaccination report", href: "/health", source: "health" },
  { name: "Breeding report", href: "/breeding", source: "breeding" },
  { name: "Birth and offspring report", href: "/breeding", source: "births" },
  { name: "Weight and growth report", href: "/animals", source: "weights" },
  { name: "Mortality report", href: "/animals?status=dead", source: "mortality" },
  { name: "Sales report", href: "/finance", source: "finance" },
  { name: "Expenses report", href: "/finance", source: "finance" },
  { name: "Profit/loss report", href: "/finance", source: "finance" },
  { name: "Herd valuation report", href: "/finance", source: "finance" },
  { name: "Marketplace sales report", href: "/marketplace", source: "marketplace" }
] as const;

export default async function ReportsPage() {
  const supabase = await createClient();
  const farm = await getCurrentFarm();

  const [{ count: animals }, { count: health }, { count: breeding }, { count: births }, { count: weights }, { count: mortality }, { count: finance }, { count: marketplace }] =
    await Promise.all([
      supabase.from("animals").select("id", { count: "exact", head: true }).eq("farm_id", farm.id),
      supabase.from("health_records").select("id", { count: "exact", head: true }).eq("farm_id", farm.id),
      supabase.from("breeding_records").select("id", { count: "exact", head: true }).eq("farm_id", farm.id),
      supabase.from("birth_records").select("id", { count: "exact", head: true }).eq("farm_id", farm.id),
      supabase.from("weight_records").select("animals!inner(farm_id)", { count: "exact", head: true }).eq("animals.farm_id", farm.id),
      supabase.from("animals").select("id", { count: "exact", head: true }).eq("farm_id", farm.id).eq("status", "dead"),
      supabase.from("finance_transactions").select("id", { count: "exact", head: true }).eq("farm_id", farm.id),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("seller_farm_id", farm.id)
    ]);

  const counts: Record<string, number> = {
    animals: animals ?? 0,
    health: health ?? 0,
    breeding: breeding ?? 0,
    births: births ?? 0,
    weights: weights ?? 0,
    mortality: mortality ?? 0,
    finance: finance ?? 0,
    marketplace: marketplace ?? 0
  };

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Open your farm records by area: animals, health, breeding, finance and marketplace activity."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <div key={report.name} className="panel flex items-center justify-between gap-3 p-4">
            <div>
              <h3 className="font-semibold">{report.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{counts[report.source]} records available</p>
            </div>
            <Link href={report.href as never} className="secondary-button">Open</Link>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
