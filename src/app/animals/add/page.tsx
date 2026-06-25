import Link from "next/link";
import { ShoppingCart, ClipboardPlus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DateField } from "@/components/DateField";
import { genderOptions, originOptions, statusOptions } from "@/lib/animal-options";
import { getCurrentFarm, getFarmSpecies } from "@/lib/farm-server";
import { createAnimal } from "./actions";

export default async function AddAnimalPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const farm = await getCurrentFarm();
  const species = await getFarmSpecies(farm.id);

  return (
    <AppShell>
      <PageHeader
        title="Add animal"
        description="Create a new animal manually or start from a marketplace purchase."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Link href="#manual-form" className="panel p-5 transition hover:border-brand-green">
          <ClipboardPlus className="text-brand-green" />
          <h3 className="mt-3 font-bold">Create animal manually</h3>
          <p className="mt-1 text-sm text-slate-600">Register a bred, purchased, imported or donated animal.</p>
        </Link>
        <Link href="/marketplace" className="panel p-5 transition hover:border-brand-green">
          <ShoppingCart className="text-brand-green" />
          <h3 className="mt-3 font-bold">Buy from marketplace</h3>
          <p className="mt-1 text-sm text-slate-600">Find listings and transfer ownership after purchase confirmation.</p>
        </Link>
      </div>
      <form id="manual-form" action={createAnimal} className="panel space-y-4 p-5">
        <h3 className="font-bold">Manual animal record</h3>
        {message ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input className="field" name="animalCode" placeholder="Animal ID, optional" />
          <input className="field" name="tagNumber" placeholder="Tag number" />
          <input className="field" name="rfidTag" placeholder="RFID / NFC tag" />
          <select className="field" name="speciesId" required>
            <option value="">Choose species</option>
            {species.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            <option value="custom">Other / add custom species</option>
          </select>
          <input className="field" name="customSpeciesName" placeholder="Custom species name, if Other" />
          <input className="field" name="customYoungName" placeholder="Young name, e.g. Cria" />
          <input className="field" name="customFemaleName" placeholder="Adult female name" />
          <input className="field" name="customMaleName" placeholder="Adult male name" />
          <input className="field" name="customAdultAgeMonths" placeholder="Adult age in months" />
          <input className="field" name="customGestationDays" placeholder="Gestation days" />
          <input className="field" name="breed" placeholder="Breed" />
          <select className="field" name="gender">
            {genderOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <DateField className="field" name="dateOfBirth" />
          <input className="field" name="weightKg" placeholder="Weight in kg" />
          <select className="field" name="status">
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select className="field" name="origin">
            {originOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input className="field" placeholder={farm.name} disabled />
        </div>
        <textarea className="field min-h-24" name="notes" placeholder="Notes, documents, photos and short videos can be attached from the animal profile." />
        <button className="primary-button" type="submit">Save animal</button>
      </form>
    </AppShell>
  );
}
