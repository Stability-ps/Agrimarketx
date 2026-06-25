"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

function textValue(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function approveMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = textValue(formData.get("listingId"));
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!listingId || !user) {
    go("/admin/listings");
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("title, seller_farm_id")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      status: "active",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: null
    })
    .eq("id", listingId);

  if (error) {
    go(`/admin/listings?message=${encodeURIComponent(error.message)}`);
  }

  if (listing?.seller_farm_id) {
    await supabase.from("app_notifications").insert({
      farm_id: listing.seller_farm_id,
      title: "Listing published",
      body: `${listing.title ?? "Your listing"} is now live on the marketplace.`,
      type: "marketplace",
      link_url: "/account/listings"
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  revalidatePath("/account/notifications");
  go(`/admin/listings?message=${encodeURIComponent("Listing approved and published to marketplace.")}`);
}

export async function rejectMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = textValue(formData.get("listingId"));
  const reason = textValue(formData.get("reason")) ?? "Listing rejected by admin.";
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!listingId || !user) {
    go("/admin/listings");
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("title, seller_farm_id")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason
    })
    .eq("id", listingId);

  if (error) {
    go(`/admin/listings?message=${encodeURIComponent(error.message)}`);
  }

  if (listing?.seller_farm_id) {
    await supabase.from("app_notifications").insert({
      farm_id: listing.seller_farm_id,
      title: "Listing needs changes",
      body: `${listing.title ?? "Your listing"} was not published. ${reason}`,
      type: "marketplace",
      link_url: "/account/listings"
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  revalidatePath("/account/notifications");
  go(`/admin/listings?message=${encodeURIComponent("Listing rejected.")}`);
}

export async function removeMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = textValue(formData.get("listingId"));
  const reason = textValue(formData.get("reason")) ?? "Removed by admin.";

  if (!listingId) {
    go("/admin/listings");
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("title, seller_farm_id")
    .eq("id", listingId)
    .maybeSingle();

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      status: "removed",
      rejection_reason: reason
    })
    .eq("id", listingId);

  if (error) {
    go(`/admin/listings?message=${encodeURIComponent(error.message)}`);
  }

  if (listing?.seller_farm_id) {
    await supabase.from("app_notifications").insert({
      farm_id: listing.seller_farm_id,
      title: "Listing removed",
      body: `${listing.title ?? "Your listing"} was removed from the marketplace. ${reason}`,
      type: "marketplace",
      link_url: "/account/listings"
    });
  }

  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  revalidatePath("/account/notifications");
  go(`/admin/listings?message=${encodeURIComponent("Listing removed from marketplace.")}`);
}

export async function updateDisputeStatus(formData: FormData) {
  const supabase = await createClient();
  const disputeId = textValue(formData.get("disputeId"));
  const status = textValue(formData.get("status")) ?? "reviewing";

  if (!disputeId) {
    go("/admin/reports");
  }

  const { error } = await supabase
    .from("disputes")
    .update({ status })
    .eq("id", disputeId);

  if (error) {
    go(`/admin/reports?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  go(`/admin/reports?message=${encodeURIComponent("Report status updated.")}`);
}

export async function removeReportedListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = textValue(formData.get("listingId"));
  const disputeId = textValue(formData.get("disputeId"));
  const adminNote = textValue(formData.get("adminNote"));

  if (!listingId || !disputeId) {
    go("/admin/reports");
  }

  const { error: listingError } = await supabase
    .from("marketplace_listings")
    .update({ status: "removed", rejection_reason: adminNote ?? "Removed after report review." })
    .eq("id", listingId);

  if (listingError) {
    go(`/admin/reports?message=${encodeURIComponent(listingError.message)}`);
  }

  const { error } = await supabase
    .from("disputes")
    .update({ status: "resolved", admin_notes: adminNote })
    .eq("id", disputeId);

  if (error) {
    go(`/admin/reports?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  go(`/admin/reports?message=${encodeURIComponent("Listing removed and report resolved.")}`);
}

export async function updateSellerVerification(formData: FormData) {
  const supabase = await createClient();
  const farmId = textValue(formData.get("farmId"));
  const status = textValue(formData.get("status"));
  const reason = textValue(formData.get("reason"));

  if (!farmId || !status) {
    go("/admin/verifications");
  }

  const { data: farm } = await supabase
    .from("farms")
    .select("name")
    .eq("id", farmId)
    .maybeSingle();

  const verifiedAt = status === "verified" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("farms")
    .update({
      seller_verification_status: status,
      seller_verification_reason: reason,
      seller_verified_at: verifiedAt
    })
    .eq("id", farmId);

  if (error) {
    go(`/admin/verifications?message=${encodeURIComponent(error.message)}`);
  }

  const statusLabel = status.replace(/_/g, " ");
  await supabase.from("app_notifications").insert({
    farm_id: farmId,
    title: "Seller verification updated",
    body: `${farm?.name ?? "Your farm"} verification status is now ${statusLabel}.${reason ? ` ${reason}` : ""}`,
    type: "verification",
    link_url: "/account/verification"
  });

  revalidatePath("/admin/verifications");
  revalidatePath("/marketplace");
  revalidatePath("/account");
  revalidatePath("/account/notifications");
  go(`/admin/verifications?message=${encodeURIComponent("Seller verification updated.")}`);
}

export async function updateBuyerRequestStatus(formData: FormData) {
  const supabase = await createClient();
  const requestId = textValue(formData.get("requestId"));
  const status = textValue(formData.get("status")) ?? "pending_review";
  const adminNote = textValue(formData.get("adminNote"));
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!requestId || !user) {
    go("/admin/wanted-requests");
  }

  const { data: request } = await supabase
    .from("buyer_requests")
    .select("title, category, province, buyer_id")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("buyer_requests")
    .update({
      status,
      admin_note: adminNote,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", requestId);

  if (error) {
    go(`/admin/wanted-requests?message=${encodeURIComponent(error.message)}`);
  }

  if (request?.buyer_id) {
    await supabase.from("app_notifications").insert({
      user_id: request.buyer_id,
      title: "Buyer request updated",
      body: `${request.title ?? "Your request"} is now ${status.replace(/_/g, " ")}.${adminNote ? ` ${adminNote}` : ""}`,
      type: "marketplace",
      link_url: "/account/requests"
    });
  }

  if (request && ["approved", "published"].includes(status)) {
    const { data: matchingFarms } = await supabase
      .from("farms")
      .select("id, province, supply_categories")
      .contains("supply_categories", [request.category])
      .limit(50);
    const categoryMatches = matchingFarms?.length ? matchingFarms : [];
    const provinceMatches = categoryMatches.filter((farm) => !request.province || String(farm.province ?? "").toLowerCase() === String(request.province).toLowerCase());
    const farmsToNotify = provinceMatches.length ? provinceMatches : categoryMatches;

    if (farmsToNotify.length > 0) {
      await supabase.from("app_notifications").insert(
        farmsToNotify.map((farm) => ({
          farm_id: farm.id,
          title: "New buyer request match",
          body: `${request.title} matches what your farm sells or offers.`,
          type: "marketplace",
          link_url: `/marketplace/wanted?request=${requestId}`
        }))
      );
    }
  }

  revalidatePath("/admin/wanted-requests");
  revalidatePath("/marketplace/wanted");
  revalidatePath("/account/requests");
  revalidatePath("/account/notifications");
  go(`/admin/wanted-requests?message=${encodeURIComponent("Buyer request updated.")}`);
}
