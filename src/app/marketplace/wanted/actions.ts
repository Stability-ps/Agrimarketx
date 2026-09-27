"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanFileName, isImageFile } from "@/lib/files";
import { marketplaceSubcategories, normalizeMarketplaceCategory } from "@/lib/marketplace-categories";
import { requireVerifiedSellerForWantedRequest } from "@/lib/seller-verification";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const text = String(formData.get(key) ?? "").trim();
  return text || null;
}

function go(path: string): never {
  redirect(path as never);
}

async function uploadWantedPhotos(supabase: Awaited<ReturnType<typeof createClient>>, requestId: string, files: FormDataEntryValue[]) {
  const images = files.filter((file): file is File => file instanceof File && file.size > 0);

  if (images.length === 0) {
    return;
  }

  if (images.length > 4) {
    throw new Error("Wanted requests allow up to 4 photos.");
  }

  for (const [index, file] of images.entries()) {
    if (!isImageFile(file)) {
      throw new Error("Please upload image files only.");
    }

    const path = `buyer-requests/${requestId}/${Date.now()}-${index}-${cleanFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("farm-assets").upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

    if (uploadError) {
      console.error("[photo-upload]", uploadError.message);
      throw new Error("We could not upload your photo. Please try again.");
    }

    const { error: mediaError } = await supabase.from("buyer_request_media").insert({
      request_id: requestId,
      storage_path: path,
      media_type: "photo",
      is_primary: index === 0
    });

    if (mediaError) {
      console.error("[photo-record]", mediaError.message);
      throw new Error("Your photo was uploaded but could not be attached. Please try again.");
    }
  }
}

export async function createBuyerRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go(`/login?next=${encodeURIComponent("/marketplace/wanted")}&message=${encodeURIComponent("Sign in to create a buyer request.")}`);
  }

  await requireVerifiedSellerForWantedRequest();

  const title = value(formData, "title");
  const category = normalizeMarketplaceCategory(value(formData, "category"));
  const rawSubcategory = value(formData, "subcategory");
  const subcategory = rawSubcategory && marketplaceSubcategories(category).some((item) => item.slug === rawSubcategory) ? rawSubcategory : null;

  if (!title) {
    go(`/marketplace/wanted?message=${encodeURIComponent("Add a short request title.")}`);
  }

  const { data: requestRecord, error } = await supabase
    .from("buyer_requests")
    .insert({
      buyer_id: user.id,
      category,
      subcategory,
      title,
      description: value(formData, "description"),
      province: value(formData, "province"),
      town: value(formData, "town"),
      approximate_location: value(formData, "approximateLocation"),
      quantity: value(formData, "quantity"),
      budget: value(formData, "budget"),
      urgency: value(formData, "urgency") ?? "flexible",
      needed_by: value(formData, "neededBy"),
      contact_preference: value(formData, "contactPreference"),
      status: "pending_review"
    })
    .select("id")
    .single();

  if (error) {
    go(`/marketplace/wanted?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  try {
    await uploadWantedPhotos(supabase, requestRecord.id, formData.getAll("requestPhotos"));
  } catch (photoError) {
    go(`/marketplace/wanted?message=${encodeURIComponent(photoError instanceof Error ? photoError.message : "Could not upload request photos.")}`);
  }

  await supabase.from("app_notifications").insert({
    title: "New buyer request",
    body: `${title} is waiting for review.`,
    type: "marketplace",
    link_url: "/admin/wanted-requests"
  });

  revalidatePath("/marketplace/wanted");
  revalidatePath("/account/requests");
  revalidatePath("/admin/wanted-requests");
  go(`/account/requests?message=${encodeURIComponent("Request submitted. It will appear after admin approval.")}`);
}

export async function respondToBuyerRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const requestId = value(formData, "requestId");
  const farmId = value(formData, "farmId");
  const message = value(formData, "message");

  if (!user || !requestId) {
    go("/marketplace/wanted");
  }

  if (!farmId || !message) {
    go(`/marketplace/wanted?message=${encodeURIComponent("Choose a farm and add a response message.")}`);
  }

  const { error } = await supabase.from("buyer_request_responses").insert({
    request_id: requestId,
    seller_farm_id: farmId,
    seller_user_id: user.id,
    message,
    quote_amount: Number(String(formData.get("quoteAmount") ?? "").replace(/[^0-9.]/g, "")) || null,
    available_quantity: value(formData, "availableQuantity"),
    delivery_option: value(formData, "deliveryOption"),
    contact_preference: value(formData, "contactPreference")
  });

  if (error) {
    go(`/marketplace/wanted?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/marketplace/wanted");
  revalidatePath("/account/requests");
  go(`/marketplace/wanted?message=${encodeURIComponent("Response sent to the buyer.")}`);
}
