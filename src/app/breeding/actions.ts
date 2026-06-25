"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";

function go(path: string): never {
  redirect(path as never);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function optionalInteger(value: FormDataEntryValue | null, fallback: number) {
  const number = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function speciesCode(name: string) {
  return name.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "ANM";
}

export async function createBreedingRecord(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const femaleAnimalId = optionalString(formData.get("femaleAnimalId"));
  const maleAnimalId = optionalString(formData.get("maleAnimalId"));
  const recordType = String(formData.get("recordType") ?? "mating");
  const eventDate = optionalString(formData.get("eventDate")) ?? new Date().toISOString().slice(0, 10);
  const manualExpectedBirthDate = optionalString(formData.get("expectedBirthDate"));

  if (!femaleAnimalId) {
    go(`/breeding?message=${encodeURIComponent("Choose the female animal or dam.")}`);
  }

  const { data: femaleAnimal } = await supabase
    .from("animals")
    .select("id, breed, species_id, species(name, young_name, gestation_period_days)")
    .eq("id", femaleAnimalId)
    .eq("farm_id", farm.id)
    .maybeSingle();

  if (!femaleAnimal) {
    go(`/breeding?message=${encodeURIComponent("Choose a valid female animal from this farm.")}`);
  }

  if (maleAnimalId) {
    const { data: maleAnimal } = await supabase
      .from("animals")
      .select("id")
      .eq("id", maleAnimalId)
      .eq("farm_id", farm.id)
      .maybeSingle();

    if (!maleAnimal) {
      go(`/breeding?message=${encodeURIComponent("Choose a valid sire from this farm.")}`);
    }
  }

  const species = Array.isArray(femaleAnimal.species) ? femaleAnimal.species[0] : femaleAnimal.species;
  const gestationDays = species?.gestation_period_days;
  const expectedBirthDate =
    manualExpectedBirthDate ??
    ((recordType === "mating" || recordType === "exposure") && gestationDays ? addDays(eventDate, gestationDays) : null);

  const { error } = await supabase.from("breeding_records").insert({
    farm_id: farm.id,
    female_animal_id: femaleAnimalId,
    male_animal_id: maleAnimalId,
    record_type: recordType,
    event_date: eventDate,
    pregnancy_status: optionalString(formData.get("pregnancyStatus")),
    expected_birth_date: expectedBirthDate,
    notes: optionalString(formData.get("notes"))
  });

  if (error) {
    go(`/breeding?message=${encodeURIComponent(error.message)}`);
  }

  if (recordType === "birth") {
    const offspringCount = optionalInteger(formData.get("offspringCount"), 1);
    const { error: birthError } = await supabase.from("birth_records").insert({
      farm_id: farm.id,
      dam_id: femaleAnimalId,
      sire_id: maleAnimalId,
      birth_date: eventDate,
      offspring_count: offspringCount,
      notes: optionalString(formData.get("notes"))
    });

    if (birthError) {
      go(`/breeding?message=${encodeURIComponent(birthError.message)}`);
    }

    const { count } = await supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .eq("farm_id", farm.id);

    const speciesName = species?.name ?? "Animal";
    const youngName = species?.young_name ?? "Young animal";
    const startingSequence = (count ?? 0) + 1;
    const offspring = Array.from({ length: offspringCount }, (_, index) => {
      const sequence = String(startingSequence + index).padStart(4, "0");
      const passportId = `PAS-${farm.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${index + 1}`;

      return {
        farm_id: farm.id,
        species_id: femaleAnimal.species_id,
        animal_code: `AGX-${speciesCode(speciesName)}-${sequence}`,
        passport_id: passportId,
        qr_code_payload: passportId,
        breed: femaleAnimal.breed,
        gender: "unknown",
        date_of_birth: eventDate,
        age_category: youngName,
        status: "alive",
        origin: "bred_on_farm",
        sire_id: maleAnimalId,
        dam_id: femaleAnimalId,
        notes: `Created from birth record on ${eventDate}.`
      };
    });

    const { error: offspringError } = await supabase.from("animals").insert(offspring);

    if (offspringError) {
      go(`/breeding?message=${encodeURIComponent(offspringError.message)}`);
    }
  }

  revalidatePath("/breeding");
  revalidatePath("/animals");
  revalidatePath(`/animals/${femaleAnimalId}`);
  if (maleAnimalId) {
    revalidatePath(`/animals/${maleAnimalId}`);
  }

  go(`/breeding?message=${encodeURIComponent("Breeding record saved.")}`);
}
