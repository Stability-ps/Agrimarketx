"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDiditVerificationSession } from "@/lib/didit";
import { requirePlatformAdmin } from "@/lib/privileged-reads";

function go(path: string): never {
  redirect(path as never);
}

function textValue(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function approveMarketplaceListing(formData: FormData) {
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase, user } = await requirePlatformAdmin();
  const listingId = textValue(formData.get("listingId"));

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
    go(`/admin/listings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
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
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase, user } = await requirePlatformAdmin();
  const listingId = textValue(formData.get("listingId"));
  const reason = textValue(formData.get("reason")) ?? "Listing rejected by admin.";

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
    go(`/admin/listings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
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
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase } = await requirePlatformAdmin();
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
    go(`/admin/listings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
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
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase } = await requirePlatformAdmin();
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
    go(`/admin/reports?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/admin/reports");
  go(`/admin/reports?message=${encodeURIComponent("Report status updated.")}`);
}

export async function removeReportedListing(formData: FormData) {
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase } = await requirePlatformAdmin();
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
    go(`/admin/reports?message=${encodeURIComponent(userSafeErrorMessage(listingError))}`);
  }

  const { error } = await supabase
    .from("disputes")
    .update({ status: "resolved", admin_notes: adminNote })
    .eq("id", disputeId);

  if (error) {
    go(`/admin/reports?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
  go(`/admin/reports?message=${encodeURIComponent("Listing removed and report resolved.")}`);
}

export async function updateSellerVerification(formData: FormData) {
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase } = await requirePlatformAdmin();
  const farmId = textValue(formData.get("farmId"));
  const action = textValue(formData.get("action")) ?? "save";
  const requestedStatus = textValue(formData.get("status"));
  const reason = textValue(formData.get("reason"));
  const sellerAccountRole = textValue(formData.get("sellerAccountRole")) ?? "individual_seller";

  if (!farmId) {
    go("/admin/verifications");
  }

  const { data: farm } = await supabase
    .from("farms")
    .select("name, email_verified, phone_verified, seller_verification_status, seller_type, document_status, facial_verification_status, owner_name")
    .eq("id", farmId)
    .maybeSingle();

  const status = action === "approve_documents"
    ? "documents_approved_pending_facial_verification"
    : action === "request_more_information"
      ? "more_information_required"
      : action === "manual_verify"
        ? "verified"
        : action === "reset_facial"
          ? (farm?.seller_type === "business" ? "documents_approved_pending_facial_verification" : "pending")
          : action === "generate_didit" || action === "resend_didit" || action === "request_representative_verification"
            ? (farm?.seller_verification_status ?? "pending")
          : action === "reset_override"
            ? "pending"
            : requestedStatus;

  if (!status) {
    go("/admin/verifications");
  }

  const now = new Date().toISOString();
  const verifiedAt = status === "verified" ? now : null;
  const updatePayload: Record<string, unknown> = {
    seller_verification_status: status,
    seller_verification_reason: reason,
    verification_rejection_reason: status === "rejected" || status === "suspended" ? reason : null,
    seller_account_role: sellerAccountRole,
    verification_updated_at: now,
    seller_verified_at: verifiedAt,
    admin_verification_override: action !== "reset_override",
    suspended_at: status === "suspended" ? now : null,
    rejected_at: status === "rejected" ? now : null
  };

  if (action === "approve_documents") {
    updatePayload.document_status = "approved";
    updatePayload.verification_email_sent_at = now;
    updatePayload.facial_email_sent_at = now;
    updatePayload.verification_email_status = "queued";
    updatePayload.facial_email_status = "queued";
  }

  if (action === "request_more_information") {
    updatePayload.document_status = "more_information_required";
  }

  if (action === "manual_verify") {
    updatePayload.document_status = farm?.seller_type === "business" ? "approved" : farm?.document_status;
    updatePayload.facial_verification_status = "verified";
  }

  if (action === "reset_facial") {
    updatePayload.facial_verification_status = "not_started";
    updatePayload.seller_verified_at = null;
  }

  if (action === "reset_override") {
    updatePayload.admin_verification_override = false;
    updatePayload.seller_verification_reason = null;
    updatePayload.verification_rejection_reason = null;
    updatePayload.suspended_at = null;
    updatePayload.rejected_at = null;
  }

  const { error } = await supabase
    .from("farms")
    .update(updatePayload)
    .eq("id", farmId);

  if (error) {
    go(`/admin/verifications?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  const { data: members } = await supabase
    .from("farm_members")
    .select("user_id")
    .eq("farm_id", farmId)
    .eq("role", "owner")
    .limit(1);
  const ownerUserId = members?.[0]?.user_id;

  if (ownerUserId) {
    const admin = createAdminClient();
    let diditSessionId: string | null = null;
    let diditUrl: string | null = null;

    if (action === "generate_didit" || action === "resend_didit" || action === "request_representative_verification") {
      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", ownerUserId)
        .maybeSingle();
      const session = await createDiditVerificationSession({
        userId: ownerUserId,
        email: profile?.email,
        fullName: profile?.full_name ?? farm?.owner_name
      });
      diditSessionId = session.sessionId;
      diditUrl = session.verificationUrl;

      if (action === "request_representative_verification") {
        updatePayload.representative_verification_required = true;
        updatePayload.representative_verification_status = "pending";
        updatePayload.didit_session_id = diditSessionId;
      } else {
        updatePayload.facial_didit_session_id = diditSessionId;
        updatePayload.facial_verification_status = "pending";
        updatePayload.seller_verification_status = "facial_verification_pending";
      }

      await admin.from("farms").update(updatePayload).eq("id", farmId);
    }

    await admin.from("seller_verifications").upsert({
      user_id: ownerUserId,
      seller_verification_status: status,
      admin_verification_override: action !== "reset_override",
      verification_rejection_reason: updatePayload.verification_rejection_reason,
      account_role: sellerAccountRole,
      seller_type: farm?.seller_type ?? "individual",
      document_status: updatePayload.document_status ?? farm?.document_status ?? "not_submitted",
      facial_verification_status: updatePayload.facial_verification_status ?? farm?.facial_verification_status ?? "not_started",
      facial_didit_session_id: diditSessionId,
      verification_updated_at: now,
      suspended_at: updatePayload.suspended_at,
      rejected_at: updatePayload.rejected_at,
      representative_verification_required: updatePayload.representative_verification_required,
      representative_verification_status: updatePayload.representative_verification_status
    }, { onConflict: "user_id" });

    if (diditUrl) {
      await admin.from("app_notifications").insert({
        user_id: ownerUserId,
        farm_id: farmId,
        title: action === "request_representative_verification" ? "Representative verification requested" : "Complete facial verification",
        body: "AgriMarketX has generated your secure Didit verification link.",
        type: "verification",
        link_url: diditUrl
      });
    }
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
  revalidatePath("/seller/verification");
  revalidatePath("/account/notifications");
  go(`/admin/verifications?message=${encodeURIComponent("Seller verification updated.")}`);
}

export async function updateBuyerRequestStatus(formData: FormData) {
  // Server actions can be invoked from any route, so the admin check must
  // happen here (not only in middleware). Writes use the service role.
  const { admin: supabase, user } = await requirePlatformAdmin();
  const requestId = textValue(formData.get("requestId"));
  const status = textValue(formData.get("status")) ?? "pending_review";
  const adminNote = textValue(formData.get("adminNote"));

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
    go(`/admin/wanted-requests?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
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
