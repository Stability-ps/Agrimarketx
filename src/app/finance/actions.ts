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

function moneyValue(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function createFinanceTransaction(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const animalId = optionalString(formData.get("animalId"));
  const amount = moneyValue(formData.get("amount"));
  const transactionType = String(formData.get("transactionType") ?? "expense");
  const description = optionalString(formData.get("description"));

  if (!amount || !description) {
    go(`/finance?message=${encodeURIComponent("Enter a description and a valid amount.")}`);
  }

  if (animalId) {
    const { data: animal } = await supabase
      .from("animals")
      .select("id")
      .eq("id", animalId)
      .eq("farm_id", farm.id)
      .maybeSingle();

    if (!animal) {
      go(`/finance?message=${encodeURIComponent("Choose a valid animal from this farm.")}`);
    }
  }

  const { error } = await supabase.from("finance_transactions").insert({
    farm_id: farm.id,
    animal_id: animalId,
    transaction_type: transactionType,
    amount,
    currency: "ZAR",
    description,
    invoice_number: optionalString(formData.get("invoiceNumber")),
    paid_at: optionalString(formData.get("paidAt")),
    due_at: optionalString(formData.get("dueAt"))
  });

  if (error) {
    go(`/finance?message=${encodeURIComponent(error.message)}`);
  }

  if (animalId && transactionType === "sale") {
    await supabase
      .from("animals")
      .update({ status: "sold", sold_at: new Date().toISOString() })
      .eq("id", animalId)
      .eq("farm_id", farm.id);
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  if (animalId) {
    revalidatePath(`/animals/${animalId}`);
    revalidatePath("/animals");
  }

  go(`/finance?message=${encodeURIComponent("Finance transaction saved.")}`);
}
