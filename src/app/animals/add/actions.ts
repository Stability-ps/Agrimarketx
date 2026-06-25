"use server";

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

function optionalNumber(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalInteger(value: FormDataEntryValue | null, fallback: number) {
  const number = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function speciesCode(name: string) {
  return name.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "ANM";
}

export async function createAnimal(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  let speciesId = optionalString(formData.get("speciesId"));
  const manualCode = optionalString(formData.get("animalCode"));

  if (!speciesId) {
    go(`/animals/add?message=${encodeURIComponent("Choose a species before saving the animal.")}`);
  }

  if (speciesId === "custom") {
    const customSpeciesName = optionalString(formData.get("customSpeciesName"));

    if (!customSpeciesName) {
      go(`/animals/add?message=${encodeURIComponent("Enter a custom species name.")}`);
    }

    const { data: existingSpecies } = await supabase
      .from("species")
      .select("id,name")
      .ilike("name", customSpeciesName)
      .maybeSingle();

    if (existingSpecies) {
      speciesId = existingSpecies.id;
    } else {
      const { data: customSpecies, error: customSpeciesError } = await supabase
        .from("species")
        .insert({
          name: customSpeciesName,
          young_name: optionalString(formData.get("customYoungName")) ?? "Young",
          adult_female_name: optionalString(formData.get("customFemaleName")) ?? "Adult female",
          adult_male_name: optionalString(formData.get("customMaleName")) ?? "Adult male",
          adult_age_threshold_months: optionalInteger(formData.get("customAdultAgeMonths"), 12),
          gestation_period_days: optionalInteger(formData.get("customGestationDays"), 0),
          default_breeding_terms: "Custom species breeding terms.",
          is_default: false
        })
        .select("id,name")
        .single();

      if (customSpeciesError || !customSpecies) {
        go(`/animals/add?message=${encodeURIComponent(customSpeciesError?.message ?? "Could not create custom species.")}`);
      }

      speciesId = customSpecies.id;
    }

    await supabase
      .from("farm_species")
      .upsert({ farm_id: farm.id, species_id: speciesId, is_active: true }, { onConflict: "farm_id,species_id" });
  }

  const { data: species } = await supabase
    .from("species")
    .select("name")
    .eq("id", speciesId)
    .single();

  const speciesName = species?.name ?? "Animal";

  const { count } = await supabase
    .from("animals")
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farm.id);

  const sequence = String((count ?? 0) + 1).padStart(4, "0");
  const animalCode = manualCode ?? `AGX-${speciesCode(speciesName)}-${sequence}`;
  const passportId = `PAS-${farm.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const currentWeight = optionalNumber(formData.get("weightKg"));

  const { data: animal, error } = await supabase
    .from("animals")
    .insert({
      farm_id: farm.id,
      species_id: speciesId,
      animal_code: animalCode,
      passport_id: passportId,
      qr_code_payload: passportId,
      tag_number: optionalString(formData.get("tagNumber")),
      rfid_nfc_tag: optionalString(formData.get("rfidTag")),
      breed: optionalString(formData.get("breed")),
      gender: String(formData.get("gender") ?? "unknown"),
      date_of_birth: optionalString(formData.get("dateOfBirth")),
      current_weight_kg: currentWeight,
      status: String(formData.get("status") ?? "alive"),
      origin: String(formData.get("origin") ?? "bred_on_farm"),
      notes: optionalString(formData.get("notes"))
    })
    .select("id")
    .single();

  if (error || !animal) {
    go(`/animals/add?message=${encodeURIComponent(error?.message ?? "Could not save animal.")}`);
  }

  if (currentWeight) {
    await supabase.from("weight_records").insert({
      animal_id: animal.id,
      weight_kg: currentWeight,
      measured_at: new Date().toISOString().slice(0, 10)
    });
  }

  go(`/animals/${animal.id}`);
}
