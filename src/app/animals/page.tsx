import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AnimalTable } from "@/components/AnimalTable";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm, getFarmSpecies } from "@/lib/farm-server";
import { statusOptions } from "@/lib/animal-options";

export default async function AnimalsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; species?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const search = (filters.q ?? "").trim().toLowerCase();
  const speciesFilter = filters.species ?? "all";
  const statusFilter = filters.status ?? "all";
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const species = await getFarmSpecies(farm.id);
  const { data: animals } = await supabase
    .from("animals")
    .select("id, animal_code, passport_id, tag_number, rfid_nfc_tag, breed, gender, age_category, current_weight_kg, status, species_id, species(name)")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false });
  const filteredAnimals = (animals ?? []).filter((animal) => {
    const animalSpecies = Array.isArray(animal.species) ? animal.species[0] : animal.species;
    const matchesSearch =
      !search ||
      [
        animal.animal_code,
        animal.passport_id,
        animal.tag_number,
        animal.rfid_nfc_tag,
        animal.breed,
        animalSpecies?.name,
        animal.gender,
        animal.age_category,
        animal.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    const matchesSpecies = speciesFilter === "all" || animal.species_id === speciesFilter;
    const matchesStatus = statusFilter === "all" || animal.status === statusFilter;

    return matchesSearch && matchesSpecies && matchesStatus;
  });

  return (
    <AppShell>
      <PageHeader
        title="Animals"
        description="Search, filter and manage animals across farms, camps, sections, herds and groups."
        action={<Link href="/animals/add" className="primary-button">Add animal</Link>}
      />
      <form className="mb-4 grid gap-3 sm:grid-cols-4" action="/animals">
        <input
          className="field sm:col-span-2"
          name="q"
          placeholder="Search by ID, tag, RFID, passport or breed"
          defaultValue={filters.q ?? ""}
        />
        <select className="field" name="species" defaultValue={speciesFilter}>
          <option value="all">All species</option>
          {species.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="field" name="status" defaultValue={statusFilter}>
          <option value="all">All statuses</option>
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="primary-button sm:w-fit" type="submit">Apply filters</button>
        <Link href="/animals" className="secondary-button sm:w-fit">Clear</Link>
      </form>
      {(animals ?? []).length > 0 ? (
        <p className="mb-3 text-sm text-slate-600">
          Showing {filteredAnimals.length} of {(animals ?? []).length} animals
        </p>
      ) : null}
      {filteredAnimals.length === 0 && (animals ?? []).length > 0 ? (
        <div className="panel p-6 text-center">
          <h3 className="font-bold">No animals match those filters</h3>
          <p className="mt-2 text-sm text-slate-600">Try clearing the search or choosing a different species/status.</p>
          <Link href="/animals" className="secondary-button mt-4">Clear filters</Link>
        </div>
      ) : (
        <AnimalTable animals={filteredAnimals} />
      )}
    </AppShell>
  );
}
