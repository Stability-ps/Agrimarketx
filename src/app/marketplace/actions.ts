"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanFileName, validateUpload } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { marketplacePhotoLimit, marketplaceSubcategories, normalizeMarketplaceCategory } from "@/lib/marketplace-categories";
import { requireApprovedSellerVerification } from "@/lib/seller-verification";
import { recordListingMetric } from "@/lib/listing-metrics";
import { readVerifiedFarmPrivateFields } from "@/lib/privileged-reads";

function go(path: string): never {
  redirect(path as never);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function moneyValue(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function coordinateValue(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").trim());
  return Number.isFinite(number) ? number : null;
}

const PRIVATE_DETAIL_KEY_PATTERN = /phone|whatsapp|email|address|latitude|longitude|^lat$|^lng$|gps|contact|id_number|registration/i;

function detailsFromForm(formData: FormData) {
  const details: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("detail_")) {
      continue;
    }

    const detailKey = key.replace("detail_", "");
    const detailValue = optionalString(value);

    // listing_details is public; never let a crafted form smuggle contact or
    // exact-location data into it (those have dedicated private columns).
    if (PRIVATE_DETAIL_KEY_PATTERN.test(detailKey)) {
      continue;
    }

    if (detailValue) {
      details[detailKey] = detailValue;
    }
  }

  return details;
}

function listingCategory(value: FormDataEntryValue | null) {
  return normalizeMarketplaceCategory(String(value ?? "livestock"));
}

function listingSubcategory(category: string, value: FormDataEntryValue | null) {
  const subcategory = optionalString(value);
  if (!subcategory) {
    return null;
  }

  return marketplaceSubcategories(category).some((item) => item.slug === subcategory) ? subcategory : null;
}

async function registeredSellerContact(supabase: Awaited<ReturnType<typeof createClient>>, farmId: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, whatsapp_number")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  // farmId comes from getCurrentFarm() (membership-verified); owner contact
  // fields are private columns, so read them with the service role.
  const farm = await readVerifiedFarmPrivateFields<{ owner_name: string | null; owner_phone: string | null }>(farmId, "owner_name, owner_phone");

  return {
    seller_contact_name: profile?.full_name || farm?.owner_name || user?.email || null,
    seller_contact_phone: profile?.phone || farm?.owner_phone || null,
    seller_contact_whatsapp: profile?.whatsapp_number || profile?.phone || farm?.owner_phone || null,
    seller_contact_email: profile?.email || user?.email || null
  };
}

async function uploadListingPhotos(supabase: Awaited<ReturnType<typeof createClient>>, listingId: string, farmId: string, category: string, files: FormDataEntryValue[]) {
  const images = files.filter((file): file is File => file instanceof File && file.size > 0);
  const limit = marketplacePhotoLimit(category);

  if (images.length === 0) {
    return;
  }

  if (images.length > limit) {
    throw new Error(`This category allows up to ${limit} photos.`);
  }

  for (const [index, file] of images.entries()) {
    // Validate size and real content server-side (the browser-supplied MIME
    // type is not trusted).
    const validation = await validateUpload(file, "image");
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const path = `listings/${listingId}/${Date.now()}-${index}-${cleanFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("farm-assets").upload(path, file, {
      contentType: validation.contentType,
      cacheControl: "31536000",
      upsert: false
    });

    if (uploadError) {
      throw new Error(`Photo storage failed: ${uploadError.message}`);
    }

    const { error: mediaError } = await supabase.from("marketplace_listing_media").insert({
      listing_id: listingId,
      seller_farm_id: farmId,
      storage_path: path,
      media_type: "photo",
      is_primary: index === 0
    });

    if (mediaError) {
      if (mediaError.message.includes("marketplace_listing_media")) {
        throw new Error("Listing photo table is missing. Please run Supabase migration 015_trust_support_marketplace.sql, then try again.");
      }

      throw new Error(`Photo was uploaded, but the listing photo record could not be saved: ${mediaError.message}`);
    }
  }
}

export async function createMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  await requireApprovedSellerVerification("/marketplace/create");
  const animalId = optionalString(formData.get("animalId"));
  const title = optionalString(formData.get("title"));
  const price = moneyValue(formData.get("price"));

  if (!animalId || !title || !price) {
    go(`/animals/${animalId ?? ""}?message=${encodeURIComponent("Enter a listing title and price.")}`);
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

  const contact = await registeredSellerContact(supabase, farm.id);
  const { error } = await supabase.from("marketplace_listings").insert({
    seller_farm_id: farm.id,
    animal_id: animalId,
    category: "livestock",
    subcategory: listingSubcategory("livestock", formData.get("subcategory")),
    listing_details: detailsFromForm(formData),
    title,
    description: optionalString(formData.get("description")),
    price,
    currency: "ZAR",
    province: optionalString(formData.get("province")),
    town: optionalString(formData.get("town")),
    approximate_location: optionalString(formData.get("approximateLocation")),
    latitude: coordinateValue(formData.get("latitude")),
    longitude: coordinateValue(formData.get("longitude")),
    ...contact,
    preferred_contact_method: optionalString(formData.get("preferredContactMethod")) ?? "whatsapp",
    price_negotiable: String(formData.get("priceNegotiable") ?? "true") === "true",
    status: "under_review"
  });

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  await supabase.from("animals").update({ status: "to_be_sold" }).eq("id", animalId).eq("farm_id", farm.id);

  revalidatePath("/marketplace");
  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/animals");
  go(`/animals/${animalId}?message=${encodeURIComponent("Marketplace listing sent.")}`);
}

export async function createUniversalMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  await requireApprovedSellerVerification("/marketplace/create");
  const title = optionalString(formData.get("title"));
  const price = moneyValue(formData.get("price"));
  const category = listingCategory(formData.get("category"));
  const subcategory = listingSubcategory(category, formData.get("subcategory"));
  const clientRequestId = optionalString(formData.get("clientRequestId"));

  if (!title || !price) {
    go(`/marketplace/create?message=${encodeURIComponent("Enter a listing title and price.")}`);
  }

  if (clientRequestId) {
    const { data: existingListing } = await supabase
      .from("marketplace_listings")
      .select("id")
      .eq("seller_farm_id", farm.id)
      .eq("client_request_id", clientRequestId)
      .maybeSingle();

    if (existingListing?.id) {
      go(`/account/listings?message=${encodeURIComponent("Listing already submitted.")}`);
    }
  }

  const contact = await registeredSellerContact(supabase, farm.id);
  const { data: listing, error } = await supabase.from("marketplace_listings").insert({
    seller_farm_id: farm.id,
    client_request_id: clientRequestId,
    animal_id: null,
    category,
    subcategory,
    listing_details: detailsFromForm(formData),
    title,
    description: optionalString(formData.get("description")),
    price,
    currency: "ZAR",
    province: optionalString(formData.get("province")),
    town: optionalString(formData.get("town")),
    approximate_location: optionalString(formData.get("approximateLocation")),
    latitude: coordinateValue(formData.get("latitude")),
    longitude: coordinateValue(formData.get("longitude")),
    ...contact,
    preferred_contact_method: optionalString(formData.get("preferredContactMethod")) ?? "whatsapp",
    price_negotiable: String(formData.get("priceNegotiable") ?? "true") === "true",
    status: "under_review"
  }).select("id").single();

  if (error?.code === "23505") {
    go(`/account/listings?message=${encodeURIComponent("Listing already submitted.")}`);
  }

  if (error || !listing) {
    go(`/marketplace/create?message=${encodeURIComponent(userSafeErrorMessage(error, "Could not create listing."))}`);
  }

  try {
    await uploadListingPhotos(supabase, listing.id, farm.id, category, formData.getAll("listingPhotos"));
  } catch (uploadError) {
    const message = uploadError instanceof Error ? uploadError.message : "Could not upload listing photos.";
    go(`/marketplace/create?message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/marketplace");
  revalidatePath("/admin/listings");
  revalidatePath("/account/listings");
  go(`/account/listings?message=${encodeURIComponent("Listing submitted. It will appear on the public marketplace after admin approval.")}`);
}

export async function updateMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const listingId = optionalString(formData.get("listingId"));
  const animalId = optionalString(formData.get("animalId"));
  const title = optionalString(formData.get("title"));
  const price = moneyValue(formData.get("price"));
  const requestedStatus = optionalString(formData.get("status")) ?? "under_review";
  const status = requestedStatus === "removed" || requestedStatus === "draft" ? requestedStatus : "under_review";

  if (!listingId || !animalId || !title || !price) {
    go(`/animals/${animalId ?? ""}?message=${encodeURIComponent("Enter a listing title and price.")}`);
  }

  const contact = await registeredSellerContact(supabase, farm.id);
  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      title,
      description: optionalString(formData.get("description")),
      price,
      category: "livestock",
      subcategory: listingSubcategory("livestock", formData.get("subcategory")),
      listing_details: detailsFromForm(formData),
      province: optionalString(formData.get("province")),
      town: optionalString(formData.get("town")),
      approximate_location: optionalString(formData.get("approximateLocation")),
      latitude: coordinateValue(formData.get("latitude")),
      longitude: coordinateValue(formData.get("longitude")),
      ...contact,
      preferred_contact_method: optionalString(formData.get("preferredContactMethod")) ?? "whatsapp",
      price_negotiable: String(formData.get("priceNegotiable") ?? "true") === "true",
      status
    })
    .eq("id", listingId)
    .eq("animal_id", animalId)
    .eq("seller_farm_id", farm.id);

  if (error) {
    go(`/animals/${animalId}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  if (status === "removed") {
    await supabase.from("animals").update({ status: "alive" }).eq("id", animalId).eq("farm_id", farm.id);
  } else {
    await supabase.from("animals").update({ status: "to_be_sold" }).eq("id", animalId).eq("farm_id", farm.id);
  }

  revalidatePath("/marketplace");
  revalidatePath(`/animals/${animalId}`);
  revalidatePath("/animals");
  go(`/animals/${animalId}?message=${encodeURIComponent(status === "under_review" ? "Marketplace listing sent." : "Marketplace listing updated.")}`);
}

export async function sendMarketplaceEnquiry(formData: FormData) {
  const supabase = await createClient();
  const listingId = optionalString(formData.get("listingId"));
  const buyerName = optionalString(formData.get("buyerName"));
  const message = optionalString(formData.get("message"));
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!listingId || !buyerName || !message) {
    go(`/marketplace?message=${encodeURIComponent("Enter your name and message to contact the seller.")}`);
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, seller_farm_id")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (!listing) {
    go(`/marketplace?message=${encodeURIComponent("This listing is no longer available.")}`);
  }

  if (!(await checkRateLimit("guestEnquiry", user?.id))) {
    go(`/marketplace/${listingId}?message=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`);
  }

  const { error } = await createAdminClient().from("marketplace_enquiries").insert({
    listing_id: listingId,
    seller_farm_id: listing.seller_farm_id,
    buyer_user_id: user?.id ?? null,
    buyer_name: buyerName,
    buyer_phone: optionalString(formData.get("buyerPhone")),
    buyer_email: optionalString(formData.get("buyerEmail")),
    preferred_contact_method: optionalString(formData.get("preferredContactMethod")) ?? "whatsapp",
    message
  });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  go(`/marketplace?message=${encodeURIComponent("Message sent to seller.")}`);
}

export async function sendGuestMarketplaceMessage(formData: FormData) {
  const supabase = await createClient();
  const listingId = optionalString(formData.get("listingId"));
  const buyerName = optionalString(formData.get("buyerName"));
  const buyerPhone = optionalString(formData.get("buyerPhone"));
  const buyerEmail = optionalString(formData.get("buyerEmail"));
  const message = optionalString(formData.get("message"));

  if (!listingId || !buyerName || (!buyerPhone && !buyerEmail) || !message) {
    go(`/marketplace/${listingId ?? ""}?message=${encodeURIComponent("Add your name, phone or email, and a short message.")}`);
  }

  if (!(await checkRateLimit("guestEnquiry"))) {
    go(`/marketplace/${listingId}?message=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`);
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, seller_farm_id")
    .eq("id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (!listing) {
    go(`/marketplace?message=${encodeURIComponent("This listing is no longer available.")}`);
  }

  const { error } = await createAdminClient().from("marketplace_enquiries").insert({
    listing_id: listing.id,
    seller_farm_id: listing.seller_farm_id,
    buyer_user_id: null,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    buyer_email: buyerEmail,
    preferred_contact_method: buyerPhone ? "whatsapp" : "email",
    message
  });

  if (error) {
    go(`/marketplace/${listing.id}?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  await recordListingMetric(listing.id, "chat");

  await createAdminClient().from("app_notifications").insert({
    farm_id: listing.seller_farm_id,
    title: "New guest marketplace enquiry",
    body: `${buyerName} sent a message about ${listing.title}.`,
    type: "message",
    link_url: "/account/messages"
  });

  revalidatePath(`/marketplace/${listing.id}`);
  revalidatePath("/account/listings");
  go(`/marketplace/${listing.id}?message=${encodeURIComponent("Your message has been sent to the seller.")}`);
}

export async function updateMarketplaceEnquiryStatus(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const enquiryId = optionalString(formData.get("enquiryId"));
  const status = optionalString(formData.get("status")) ?? "contacted";

  if (!enquiryId) {
    go("/marketplace");
  }

  const { error } = await supabase
    .from("marketplace_enquiries")
    .update({ status })
    .eq("id", enquiryId)
    .eq("seller_farm_id", farm.id);

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  go(`/marketplace?message=${encodeURIComponent("Enquiry updated.")}`);
}

export async function makeMarketplaceOffer(formData: FormData) {
  const supabase = await createClient();
  const listingId = optionalString(formData.get("listingId"));
  const amount = moneyValue(formData.get("amount"));

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go(`/login?next=${encodeURIComponent("/marketplace")}&message=${encodeURIComponent("Create an account or sign in to make an offer.")}`);
  }

  if (!listingId || !amount) {
    go(`/marketplace?message=${encodeURIComponent("Enter a valid offer amount.")}`);
  }

  const { error } = await supabase.from("marketplace_offers").insert({
    listing_id: listingId,
    buyer_id: user.id,
    amount,
    currency: "ZAR",
    message: optionalString(formData.get("message"))
  });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  go(`/marketplace?message=${encodeURIComponent("Offer sent to seller.")}`);
}

export async function toggleSavedListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = optionalString(formData.get("listingId"));
  const currentlySaved = optionalString(formData.get("saved")) === "true";
  const redirectTo = optionalString(formData.get("redirectTo"));
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!listingId) {
    go("/marketplace");
  }

  if (!user) {
    go(`/login?next=${encodeURIComponent(redirectTo || `/marketplace/${listingId}`)}&message=${encodeURIComponent("Create an account or sign in to save marketplace favourites.")}`);
  }

  if (currentlySaved) {
    const { error } = await supabase
      .from("marketplace_saved_listings")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", user.id);

    if (error) {
      go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
    }

    revalidatePath("/marketplace");
    revalidatePath("/settings");
    go(redirectTo || `/marketplace?message=${encodeURIComponent("Removed from favourites.")}`);
  }

  const { error } = await supabase.from("marketplace_saved_listings").upsert({
    listing_id: listingId,
    user_id: user.id
  }, { onConflict: "listing_id,user_id" });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  revalidatePath("/settings");
  go(redirectTo || `/marketplace?message=${encodeURIComponent("Saved to your favourites.")}`);
}

export async function reportMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const listingId = optionalString(formData.get("listingId"));
  const reason = optionalString(formData.get("reason"));
  const notes = optionalString(formData.get("notes"));
  const redirectTo = optionalString(formData.get("redirectTo"));
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!listingId || !reason) {
    go("/marketplace");
  }

  if (!(await checkRateLimit("listingReport", user?.id))) {
    go(`/marketplace/${listingId}?message=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`);
  }

  const { error } = await supabase.from("disputes").insert({
    listing_id: listingId,
    opened_by: user?.id ?? null,
    summary: notes ? `${reason}: ${notes}` : reason
  });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  go(redirectTo || `/marketplace?message=${encodeURIComponent("Thanks. The listing report was sent for review.")}`);
}

export async function acceptMarketplaceOffer(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const listingId = optionalString(formData.get("listingId"));
  const offerId = optionalString(formData.get("offerId"));

  if (!listingId || !offerId) {
    go("/marketplace");
  }

  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, animal_id, seller_farm_id, marketplace_offers(id, buyer_id)")
    .eq("id", listingId)
    .eq("seller_farm_id", farm.id)
    .maybeSingle();

  const offer = Array.isArray(listing?.marketplace_offers)
    ? listing?.marketplace_offers.find((item) => item.id === offerId)
    : null;

  if (!listing || !offer) {
    go(`/marketplace?message=${encodeURIComponent("Choose a valid offer for your listing.")}`);
  }

  const { error: offerError } = await supabase
    .from("marketplace_offers")
    .update({ status: "accepted" })
    .eq("id", offerId)
    .eq("listing_id", listingId);

  if (offerError) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(offerError))}`);
  }

  await supabase.from("marketplace_listings").update({ status: "reserved" }).eq("id", listingId).eq("seller_farm_id", farm.id);
  await supabase.from("animals").update({ status: "reserved" }).eq("id", listing.animal_id).eq("farm_id", farm.id);

  const { error: transferError } = await supabase.from("ownership_transfers").insert({
    animal_id: listing.animal_id,
    seller_farm_id: farm.id,
    buyer_user_id: offer.buyer_id,
    status: "seller_ready"
  });

  if (transferError) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(transferError))}`);
  }

  revalidatePath("/marketplace");
  revalidatePath(`/animals/${listing.animal_id}`);
  go(`/marketplace?message=${encodeURIComponent("Offer accepted. Ownership transfer started.")}`);
}

export async function selectTransferDelivery(formData: FormData) {
  const supabase = await createClient();
  const transferId = optionalString(formData.get("transferId"));
  const buyerFarmId = optionalString(formData.get("buyerFarmId"));
  const deliveryMethod = optionalString(formData.get("deliveryMethod"));

  if (!transferId || !buyerFarmId || !deliveryMethod) {
    go(`/marketplace?message=${encodeURIComponent("Choose collect or delivery and a buyer farm.")}`);
  }

  const { error } = await supabase.rpc("buyer_select_transfer_delivery", {
    transfer_id: transferId,
    selected_delivery_method: deliveryMethod,
    selected_buyer_farm_id: buyerFarmId
  });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  go(`/marketplace?message=${encodeURIComponent("Delivery choice saved. Seller can now move the animal in transit.")}`);
}

export async function confirmTransferReceived(formData: FormData) {
  const supabase = await createClient();
  const transferId = optionalString(formData.get("transferId"));
  const buyerFarmId = optionalString(formData.get("buyerFarmId"));

  if (!transferId || !buyerFarmId) {
    go(`/marketplace?message=${encodeURIComponent("Choose the receiving farm.")}`);
  }

  const { error } = await supabase.rpc("complete_ownership_transfer", {
    transfer_id: transferId,
    selected_buyer_farm_id: buyerFarmId
  });

  if (error) {
    go(`/marketplace?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace");
  revalidatePath("/animals");
  revalidatePath("/dashboard");
  go(`/marketplace?message=${encodeURIComponent("Animal received. Ownership history moved to your farm.")}`);
}
