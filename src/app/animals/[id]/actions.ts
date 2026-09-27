"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
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
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function updateAnimal(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = optionalString(formData.get("animalId"));

  if (!animalId) {
    go("/animals");
  }

  const { error } = await supabase
    .from("animals")
    .update({
      animal_code: optionalString(formData.get("animalCode")),
      species_id: optionalString(formData.get("speciesId")),
      tag_number: optionalString(formData.get("tagNumber")),
      rfid_nfc_tag: optionalString(formData.get("rfidTag")),
      breed: optionalString(formData.get("breed")),
      gender: String(formData.get("gender") ?? "unknown"),
      date_of_birth: optionalString(formData.get("dateOfBirth")),
      status: String(formData.get("status") ?? "alive"),
      origin: String(formData.get("origin") ?? "bred_on_farm"),
      notes: optionalString(formData.get("notes"))
    })
    .eq("id", animalId)
    .eq("farm_id", farm.id);

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/animals");
  go(`/animals/${animalId}?message=${encodeURIComponent("Animal updated.")}`);
}

export async function addWeightRecord(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = optionalString(formData.get("animalId"));
  const weightKg = optionalNumber(formData.get("weightKg"));
  const measuredAt = optionalString(formData.get("measuredAt")) ?? new Date().toISOString().slice(0, 10);
  const notes = optionalString(formData.get("notes"));

  if (!animalId || !weightKg) {
    go(`/animals/${animalId ?? ""}?message=${encodeURIComponent("Enter a valid weight.")}`);
  }

  const { data: animal } = await supabase
    .from("animals")
    .select("id")
    .eq("id", animalId)
    .eq("farm_id", farm.id)
    .maybeSingle();

  if (!animal) {
    go("/animals");
  }

  const { error: weightError } = await supabase.from("weight_records").insert({
    animal_id: animalId,
    weight_kg: weightKg,
    measured_at: measuredAt,
    notes
  });

  if (weightError) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(weightError))}`);
  }

  const { error: updateError } = await supabase
    .from("animals")
    .update({ current_weight_kg: weightKg })
    .eq("id", animalId)
    .eq("farm_id", farm.id);

  if (updateError) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(updateError))}`);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/animals");
  go(`/animals/${animalId}?message=${encodeURIComponent("Weight recorded.")}`);
}

export async function addHealthRecord(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = optionalString(formData.get("animalId"));
  const recordType = String(formData.get("recordType") ?? "treatment");
  const administeredAt = optionalString(formData.get("administeredAt")) ?? new Date().toISOString().slice(0, 10);

  if (!animalId) {
    go("/animals");
  }

  const { data: animal } = await supabase
    .from("animals")
    .select("id")
    .eq("id", animalId)
    .eq("farm_id", farm.id)
    .maybeSingle();

  if (!animal) {
    go("/animals");
  }

  const { error } = await supabase.from("health_records").insert({
    farm_id: farm.id,
    animal_id: animalId,
    record_type: recordType,
    product_name: optionalString(formData.get("productName")),
    batch_number: optionalString(formData.get("batchNumber")),
    dosage: optionalString(formData.get("dosage")),
    withdrawal_period_days: optionalNumber(formData.get("withdrawalDays")),
    administered_at: administeredAt,
    due_at: optionalString(formData.get("dueAt")),
    notes: optionalString(formData.get("notes"))
  });

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/health");
  go(`/animals/${animalId}?message=${encodeURIComponent("Health record added.")}`);
}
