import Link from "next/link";
import { optionLabel, statusOptions } from "@/lib/animal-options";

type AnimalRow = {
  id: string;
  animal_code: string;
  tag_number: string | null;
  breed: string | null;
  gender: string | null;
  age_category: string | null;
  current_weight_kg: number | null;
  status: string | null;
  species: { name: string } | { name: string }[] | null;
};

export function AnimalTable({ animals }: { animals: AnimalRow[] }) {
  if (animals.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <h3 className="font-bold">No animals yet</h3>
        <p className="mt-2 text-sm text-slate-600">Add your first animal to start building the farm register.</p>
        <Link href="/animals/add" className="primary-button mt-4">
          Add animal
        </Link>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Species</th>
              <th className="px-4 py-3">Gender / age</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {animals.map((animal) => {
              const species = Array.isArray(animal.species) ? animal.species[0] : animal.species;

              return (
                <tr key={animal.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <Link href={`/animals/${animal.id}` as never} className="font-semibold text-brand-green">
                      {animal.animal_code}
                    </Link>
                    <div className="text-xs text-slate-500">
                      Tag {animal.tag_number || "Not set"} · {animal.breed || "Breed not set"}
                    </div>
                  </td>
                  <td className="px-4 py-4">{species?.name ?? "Unknown"}</td>
                  <td className="px-4 py-4">
                    {optionLabel([["female", "Female"], ["male", "Male"], ["unknown", "Unknown"]], animal.gender)} · {animal.age_category || "Age pending"}
                  </td>
                  <td className="px-4 py-4">{animal.current_weight_kg ? `${animal.current_weight_kg} kg` : "Not set"}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-brand-green">
                      {optionLabel(statusOptions, animal.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">Current farm</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
