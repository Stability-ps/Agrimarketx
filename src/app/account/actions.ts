"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { recordListingMetric } from "@/lib/listing-metrics";

function go(path: string): never {
  redirect(path as never);
}

function value(formData: FormData, key: string) {
  const text = String(formData.get(key) ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function submitSellerVerification() {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const { error } = await supabase
    .from("farms")
    .update({
      seller_verification_status: "pending_review",
      seller_verification_submitted_at: new Date().toISOString(),
      seller_verification_reason: null
    })
    .eq("id", farm.id);

  if (error) {
    go(`/account/verification?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  await createAdminClient().from("app_notifications").insert({
    title: "Seller verification submitted",
    body: `${farm.name} sent a seller verification application.`,
    type: "verification",
    link_url: "/admin/verifications"
  });

  revalidatePath("/account");
  revalidatePath("/account/verification");
  revalidatePath("/admin/verifications");
  go(`/account/verification?message=${encodeURIComponent("Seller verification submitted.")}`);
}

export async function updateMyListingStatus(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const listingId = value(formData, "listingId");
  const requestedStatus = value(formData, "status");
  const allowed = new Set(["paused", "sold", "removed", "under_review"]);
  const status = requestedStatus && allowed.has(requestedStatus) ? requestedStatus : null;

  if (!listingId || !status) {
    go("/account/listings");
  }

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status })
    .eq("id", listingId)
    .eq("seller_farm_id", farm.id);

  if (error) {
    go(`/account/listings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/account/listings");
  revalidatePath("/marketplace");
  go(`/account/listings?message=${encodeURIComponent("Listing updated.")}`);
}

export async function recordListingContactClick(formData: FormData) {
  const supabase = await createClient();
  const listingId = value(formData, "listingId");
  const metric = value(formData, "metric") ?? "contact";
  const redirectTo = value(formData, "redirectTo");

  if (!listingId) {
    go("/marketplace");
  }

  await recordListingMetric(listingId, metric);

  revalidatePath("/marketplace");
  go(redirectTo || `/marketplace?contact=${listingId}#listing-${listingId}`);
}

export async function toggleFarmFollow(formData: FormData) {
  const supabase = await createClient();
  const farmId = value(formData, "farmId");
  const following = value(formData, "following") === "true";
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !farmId) {
    go(`/login?next=${encodeURIComponent(farmId ? `/farms/${farmId}` : "/marketplace")}&message=${encodeURIComponent("Create an account or sign in to follow farms.")}`);
  }

  if (following) {
    await supabase.from("farm_followers").delete().eq("farm_id", farmId).eq("user_id", user.id);
  } else {
    await supabase.from("farm_followers").upsert({ farm_id: farmId, user_id: user.id }, { onConflict: "farm_id,user_id" });
    await createAdminClient().from("app_notifications").insert({
      farm_id: farmId,
      title: "New farm follower",
      body: "Someone followed your farm profile.",
      type: "follow",
      link_url: `/farms/${farmId}`
    });
  }

  revalidatePath(`/farms/${farmId}`);
  revalidatePath("/account/saved");
  revalidatePath("/account/notifications");
  go(`/farms/${farmId}?message=${encodeURIComponent(following ? "Farm removed from saved farms." : "Farm followed.")}`);
}
