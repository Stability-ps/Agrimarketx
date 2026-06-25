import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminTransfersPage() {
  const supabase = await createClient();
  const { data: transfers } = await supabase
    .from("ownership_transfers")
    .select("id, status, delivery_method, created_at, animals(animal_code, tag_number, breed, species(name))")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Ownership Transfers" description="Track marketplace transfers from seller ready to buyer received." />
      <AdminNav />
      <div className="grid gap-3">
        {(transfers ?? []).map((transfer) => {
          const animal = Array.isArray(transfer.animals) ? transfer.animals[0] : transfer.animals;
          const species = Array.isArray(animal?.species) ? animal?.species[0] : animal?.species;
          return (
            <section key={transfer.id} className="panel p-4">
              <h3 className="font-bold">{animal?.animal_code ?? "Animal"} {animal?.tag_number ? `· Tag ${animal.tag_number}` : ""}</h3>
              <p className="mt-1 text-sm text-slate-600">{species?.name ?? "Livestock"}{animal?.breed ? ` · ${animal.breed}` : ""}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Status: {String(transfer.status).replace("_", " ")} · {transfer.delivery_method ?? "No delivery method"}</p>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
