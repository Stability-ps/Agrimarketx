import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { requirePlatformAdmin } from "@/lib/privileged-reads";

export default async function AdminFarmsPage() {
  const { admin } = await requirePlatformAdmin();
  const { data: farms } = await admin
    .from("farms")
    .select("id, name, owner_name, owner_phone, location, province, country, farm_type, size_hectares, logo_url, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Farms" description="Manage registered farms and their public verification readiness." />
      <AdminNav />
      <div className="grid gap-3 lg:grid-cols-2">
        {(farms ?? []).map((farm) => (
          <section key={farm.id} className="panel p-4">
            <div className="flex items-start gap-3">
              {farm.logo_url ? <img src={farm.logo_url} alt={farm.name} className="h-14 w-14 rounded-md object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-md bg-green-50 text-xs font-bold text-brand-green">Farm</div>}
              <div>
                <h3 className="font-bold">{farm.name}</h3>
                <p className="text-sm text-slate-600">{farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "No location"}</p>
                <p className="mt-1 text-sm text-slate-600">Owner: {farm.owner_name ?? "Not set"} {farm.owner_phone ? `· ${farm.owner_phone}` : ""}</p>
                <p className="mt-1 text-sm text-slate-600">{farm.farm_type ?? "Farm"}{farm.size_hectares ? ` · ${farm.size_hectares} ha` : ""}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
