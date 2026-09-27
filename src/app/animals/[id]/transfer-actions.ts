"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";

function go(path: string): never {
  redirect(path as never);
}

export async function advanceTransfer(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const transferId = String(formData.get("transferId") ?? "");
  const animalId = String(formData.get("animalId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");
  const timestampField =
    nextStatus === "in_transit" ? "in_transit_at" :
    nextStatus === "delivered" ? "delivered_at" :
    nextStatus === "received" ? "received_at" :
    nextStatus === "seller_ready" ? "seller_ready_at" :
    null;

  if (!transferId || !animalId || !timestampField) {
    go(`/animals/${animalId}`);
  }

  const update = {
    status: nextStatus,
    [timestampField]: new Date().toISOString()
  };

  const { error } = await supabase
    .from("ownership_transfers")
    .update(update)
    .eq("id", transferId)
    .eq("seller_farm_id", farm.id);

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  if (nextStatus === "in_transit") {
    await supabase.from("animals").update({ status: "in_transit" }).eq("id", animalId).eq("farm_id", farm.id);
  }

  if (nextStatus === "delivered") {
    await supabase.from("animals").update({ status: "sold", sold_at: new Date().toISOString() }).eq("id", animalId).eq("farm_id", farm.id);
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/marketplace");
  go(`/animals/${animalId}?message=${encodeURIComponent("Transfer updated.")}`);
}
