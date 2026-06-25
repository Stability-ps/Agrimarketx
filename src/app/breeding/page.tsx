import { AppShell, PageHeader } from "@/components/AppShell";
import { DateField } from "@/components/DateField";
import { InfoCard } from "@/components/InfoCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { createBreedingRecord } from "./actions";

const breedingRecordOptions = [
  ["mating", "Mating"],
  ["exposure", "Exposure"],
  ["pregnancy_check", "Pregnancy check"],
  ["birth", "Birth record"],
  ["weaning", "Weaning"]
] as const;

function recordLabel(value?: string | null) {
  return breedingRecordOptions.find(([key]) => key === value)?.[1] ?? value ?? "Breeding record";
}

export default async function BreedingPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const farm = await getCurrentFarm();

  const { data: animals } = await supabase
    .from("animals")
    .select("id, animal_code, tag_number, breed, gender, species(name)")
    .eq("farm_id", farm.id)
    .order("animal_code", { ascending: true });

  const { data: records } = await supabase
    .from("breeding_records")
    .select(`
      id,
      record_type,
      event_date,
      pregnancy_status,
      expected_birth_date,
      notes,
      female:female_animal_id(animal_code, tag_number),
      male:male_animal_id(animal_code, tag_number)
    `)
    .eq("farm_id", farm.id)
    .order("event_date", { ascending: false })
    .limit(12);

  const recordList = records ?? [];
  const stats = [
    {
      title: "Mating / exposure",
      value: recordList.filter((record) => record.record_type === "mating" || record.record_type === "exposure").length,
      detail: "Recent breeding events"
    },
    {
      title: "Pregnancy checks",
      value: recordList.filter((record) => record.record_type === "pregnancy_check").length,
      detail: "Recorded checks"
    },
    {
      title: "Expected births",
      value: recordList.filter((record) => record.expected_birth_date).length,
      detail: "With expected birth dates"
    },
    {
      title: "Birth records",
      value: recordList.filter((record) => record.record_type === "birth").length,
      detail: "Recent births captured"
    }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Breeding"
        description="Manage mating, exposure, pregnancy checks, births, parent tracking, weaning and performance."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <InfoCard key={item.title} title={item.title} value={item.value} detail={item.detail} />
        ))}
      </div>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">New breeding record</h3>
        <p className="mt-1 text-sm text-slate-600">
          For birth records, offspring count will automatically create baby animal records linked to the dam and sire.
        </p>
        {message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
            {message}
          </div>
        ) : null}
        <form action={createBreedingRecord} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="text-sm font-semibold">Record type</span>
            <select className="field mt-1" name="recordType">
              {breedingRecordOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Female / dam</span>
            <select className="field mt-1" name="femaleAnimalId" required>
              <option value="">Choose female animal</option>
              {(animals ?? []).filter((animal) => animal.gender !== "male").map((animal) => {
                const species = Array.isArray(animal.species) ? animal.species[0] : animal.species;
                return (
                  <option key={animal.id} value={animal.id}>
                    {animal.animal_code} {animal.tag_number ? `· Tag ${animal.tag_number}` : ""} {species?.name ? `· ${species.name}` : ""} {animal.breed ? `· ${animal.breed}` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Sire / male</span>
            <select className="field mt-1" name="maleAnimalId">
              <option value="">Not set</option>
              {(animals ?? []).filter((animal) => animal.gender !== "female").map((animal) => {
                const species = Array.isArray(animal.species) ? animal.species[0] : animal.species;
                return (
                  <option key={animal.id} value={animal.id}>
                    {animal.animal_code} {animal.tag_number ? `· Tag ${animal.tag_number}` : ""} {species?.name ? `· ${species.name}` : ""} {animal.breed ? `· ${animal.breed}` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Event date</span>
            <DateField className="field mt-1" name="eventDate" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            <span className="text-sm font-semibold">Pregnancy result</span>
            <select className="field mt-1" name="pregnancyStatus">
              <option value="">Not checked</option>
              <option value="pregnant">Pregnant</option>
              <option value="not_pregnant">Not pregnant</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Expected birth date</span>
            <DateField className="field mt-1" name="expectedBirthDate" />
          </label>
          <label>
            <span className="text-sm font-semibold">Offspring count</span>
            <input className="field mt-1" name="offspringCount" placeholder="For birth records" />
          </label>
          <label className="sm:col-span-2 lg:col-span-4">
            <span className="text-sm font-semibold">Notes</span>
            <textarea className="field mt-1 min-h-20" name="notes" placeholder="Exposure details, pregnancy check notes, birth notes or weaning details" />
          </label>
          <button className="primary-button sm:w-fit" type="submit">Save breeding record</button>
        </form>
      </section>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">Recent breeding records</h3>
        <div className="mt-4 space-y-2">
          {recordList.length === 0 ? (
            <p className="text-sm text-slate-500">No breeding records yet.</p>
          ) : (
            recordList.map((record) => {
              const female = Array.isArray(record.female) ? record.female[0] : record.female;
              const male = Array.isArray(record.male) ? record.male[0] : record.male;
              return (
                <div key={record.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-semibold">{recordLabel(record.record_type)} · {record.event_date}</div>
                  <div className="mt-1 text-slate-600">
                    Dam: {female?.animal_code ?? "Not set"}
                    {female?.tag_number ? ` · Tag ${female.tag_number}` : ""}
                    {male?.animal_code ? ` · Sire: ${male.animal_code}` : " · Sire: Not set"}
                  </div>
                  <div className="mt-1 text-slate-500">
                    {record.pregnancy_status ? `Pregnancy: ${record.pregnancy_status.replace("_", " ")}` : "Pregnancy: not checked"}
                    {record.expected_birth_date ? ` · Expected birth: ${record.expected_birth_date}` : ""}
                  </div>
                  {record.notes ? <div className="mt-1 text-slate-500">{record.notes}</div> : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
