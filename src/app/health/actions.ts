"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export async function createHealthRecord(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const target = String(formData.get("target") ?? "all");
  const [targetType, targetId] = target.includes(":") ? target.split(":") : [target, null];
  const administeredAt = optionalString(formData.get("administeredAt")) ?? new Date().toISOString().slice(0, 10);
  const record = {
    farm_id: farm.id,
    record_type: String(formData.get("recordType") ?? "vaccination"),
    product_name: optionalString(formData.get("productName")),
    batch_number: optionalString(formData.get("batchNumber")),
    dosage: optionalString(formData.get("dosage")),
    withdrawal_period_days: optionalNumber(formData.get("withdrawalDays")),
    administered_at: administeredAt,
    due_at: optionalString(formData.get("dueAt")),
    notes: optionalString(formData.get("notes"))
  };

  if (targetType === "animal" && targetId) {
    const { data: animal } = await supabase
      .from("animals")
      .select("id")
      .eq("id", targetId)
      .eq("farm_id", farm.id)
      .maybeSingle();

    if (!animal) {
      go(`/health?message=${encodeURIComponent("Choose a valid animal from this farm.")}`);
    }

    const { error } = await supabase.from("health_records").insert({
      ...record,
      animal_id: targetId
    });

    if (error) {
      go(`/health?message=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/health");
    revalidatePath(`/animals/${targetId}`);
    go(`/health?message=${encodeURIComponent("Animal health record saved.")}`);
  }

  let animalQuery = supabase
    .from("animals")
    .select("id, species(name)")
    .eq("farm_id", farm.id);

  if (targetType === "species" && targetId) {
    animalQuery = animalQuery.eq("species_id", targetId);
  }

  const { data: farmAnimals, error: animalError } = await animalQuery;

  if (animalError) {
    go(`/health?message=${encodeURIComponent(animalError.message)}`);
  }

  if (!farmAnimals || farmAnimals.length === 0) {
    go(`/health?message=${encodeURIComponent("No matching animals found for that health record.")}`);
  }

  const records = farmAnimals.map((animal) => ({
    ...record,
    animal_id: animal.id
  }));

  const { error } = await supabase.from("health_records").insert(records);

  if (error) {
    go(`/health?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/health");
  farmAnimals.forEach((animal) => revalidatePath(`/animals/${animal.id}`));

  const firstSpecies = Array.isArray(farmAnimals[0].species) ? farmAnimals[0].species[0] : farmAnimals[0].species;
  const targetName = targetType === "species" ? `all ${firstSpecies?.name ?? "selected species"}` : "the herd";
  go(`/health?message=${encodeURIComponent(`Health record saved to ${farmAnimals.length} animals in ${targetName}.`)}`);
}
