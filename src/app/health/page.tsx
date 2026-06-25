import { AppShell, PageHeader } from "@/components/AppShell";
import { InfoCard } from "@/components/InfoCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm, getFarmSpecies } from "@/lib/farm-server";
import { healthRecordOptions, optionLabel } from "@/lib/animal-options";
import { DateField } from "@/components/DateField";
import { createHealthRecord } from "./actions";

export default async function HealthPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeksDate = new Date();
  twoWeeksDate.setDate(twoWeeksDate.getDate() + 14);
  const twoWeeks = twoWeeksDate.toISOString().slice(0, 10);
  const species = await getFarmSpecies(farm.id);
  const { data: animals } = await supabase
    .from("animals")
    .select("id, animal_code, tag_number, breed, species_id, species(name)")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false });

  const { data: healthRecords } = await supabase
    .from("health_records")
    .select("id, record_type, product_name, administered_at, due_at, animal_id, animals(animal_code, tag_number)")
    .eq("farm_id", farm.id)
    .order("administered_at", { ascending: false })
    .limit(8);
  const { data: dueRecords } = await supabase
    .from("health_records")
    .select("id, record_type, withdrawal_period_days")
    .eq("farm_id", farm.id)
    .gte("due_at", today)
    .lte("due_at", twoWeeks);
  const dueRows = dueRecords ?? [];
  const healthItems = [
    {
      title: "Vaccinations due",
      count: dueRows.filter((record) => record.record_type === "vaccination").length,
      detail: "Due in the next 14 days"
    },
    {
      title: "Deworming due",
      count: dueRows.filter((record) => record.record_type === "deworming").length,
      detail: "Due in the next 14 days"
    },
    {
      title: "Withdrawal periods",
      count: (healthRecords ?? []).filter((record) => record.due_at && record.due_at >= today).length,
      detail: "Records with upcoming due dates"
    },
    {
      title: "Medicine stock alerts",
      count: 0,
      detail: "Inventory alerts will connect with medicine stock"
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Health"
        description="Track vaccinations, treatments, deworming, dipping, vet records, product inventory and reminders."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthItems.map((item) => (
          <InfoCard key={item.title} title={item.title} value={item.count} detail={item.detail} />
        ))}
      </div>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">New health record</h3>
        {message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
            {message}
          </div>
        ) : null}
        <form action={createHealthRecord} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="field" name="recordType">
            {healthRecordOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className="field" name="target">
            <option value="all">All animals / herd</option>
            <optgroup label="Species groups">
              {species.map((item) => (
                <option key={item.id} value={`species:${item.id}`}>All {item.name}</option>
              ))}
            </optgroup>
            <optgroup label="Individual animals">
              {(animals ?? []).map((animal) => {
                const animalSpecies = Array.isArray(animal.species) ? animal.species[0] : animal.species;
                return (
                  <option key={animal.id} value={`animal:${animal.id}`}>
                    {animal.animal_code} {animal.tag_number ? `· Tag ${animal.tag_number}` : ""} {animalSpecies?.name ? `· ${animalSpecies.name}` : ""} {animal.breed ? `· ${animal.breed}` : ""}
                  </option>
                );
              })}
            </optgroup>
          </select>
          <input className="field" name="productName" placeholder="Medicine / product" />
          <input className="field" name="batchNumber" placeholder="Batch number" />
          <input className="field" name="dosage" placeholder="Dosage, e.g. 2 ml" />
          <input className="field" name="withdrawalDays" placeholder="Withdrawal days" />
          <label>
            <span className="text-sm font-semibold">Administered date</span>
            <DateField className="field mt-1" name="administeredAt" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            <span className="text-sm font-semibold">Next dose</span>
            <DateField className="field mt-1" name="dueAt" />
          </label>
          <textarea className="field min-h-20 sm:col-span-2 lg:col-span-3" name="notes" placeholder="Notes" />
          <button className="primary-button" type="submit">Save record</button>
        </form>
      </section>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">Recent health records</h3>
        <div className="mt-4 space-y-2">
          {(healthRecords ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No health records yet.</p>
          ) : (
            healthRecords?.map((record) => {
              const animal = Array.isArray(record.animals) ? record.animals[0] : record.animals;
              return (
                <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-semibold">
                    {optionLabel(healthRecordOptions, record.record_type)} · Administered: {record.administered_at}
                  </div>
                  <div className="mt-1 text-slate-600">
                    {record.animal_id ? `${animal?.animal_code ?? "Animal"}${animal?.tag_number ? ` · Tag ${animal.tag_number}` : ""}` : "All animals / herd"}
                    {record.product_name ? ` · ${record.product_name}` : ""}
                  </div>
                  {record.due_at ? <div className="mt-1 text-slate-500">Next dose: {record.due_at}</div> : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
