"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateUpload, VERIFICATION_DOCUMENTS_BUCKET } from "@/lib/files";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

function textValue(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function ownerFarmForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("farm_members")
    .select("farm_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  return data?.farm_id ?? null;
}

export async function submitBusinessVerification(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go("/login?next=/seller/verification");
  }

  const farmId = await ownerFarmForUser(user.id);
  if (!farmId) {
    go("/onboarding?next=/seller/verification&message=Create a farm profile before business verification.");
  }

  const admin = createAdminClient();
  const businessName = textValue(formData.get("businessName"));
  const contactPerson = textValue(formData.get("contactPerson"));
  const phone = textValue(formData.get("phone"));
  const province = textValue(formData.get("province"));
  const city = textValue(formData.get("city"));

  if (!businessName || !contactPerson || !phone || !province || !city) {
    go("/seller/verification?message=Business name, contact person, phone, province and city are required.");
  }

  const now = new Date().toISOString();
  const farmUpdate = {
    seller_type: "business",
    seller_account_role: "business_seller",
    business_name: businessName,
    trading_name: textValue(formData.get("tradingName")),
    registration_number: textValue(formData.get("registrationNumber")),
    vat_number: textValue(formData.get("vatNumber")),
    contact_person: contactPerson,
    contact_person_position: textValue(formData.get("contactPersonPosition")),
    owner_phone: phone,
    province,
    city,
    location: city,
    physical_address: textValue(formData.get("physicalAddress")),
    business_type: textValue(formData.get("businessType")),
    business_description: textValue(formData.get("businessDescription")),
    representative_name: textValue(formData.get("representativeName")) ?? contactPerson,
    representative_role: textValue(formData.get("representativeRole")) ?? textValue(formData.get("contactPersonPosition")),
    representative_email: textValue(formData.get("representativeEmail")) ?? user.email,
    representative_phone: textValue(formData.get("representativePhone")) ?? phone,
    document_status: "submitted",
    seller_verification_status: "documents_submitted",
    verification_updated_at: now,
    seller_verification_submitted_at: now
  };

  const files = [
    ["business_registration", formData.get("businessRegistration")],
    ["representative_id", formData.get("representativeId")],
    ["business_address", formData.get("businessAddress")]
  ] as const;

  for (const [documentType, value] of files) {
    if (!(value instanceof File) || value.size === 0) {
      continue;
    }

    const validation = await validateUpload(value, "document");
    if (!validation.ok) {
      go(`/seller/verification?message=${encodeURIComponent(validation.message)}`);
    }

    // Identity/business documents go to the PRIVATE bucket; admins view them
    // through short-lived signed URLs only.
    const path = `${farmId}/${documentType}-${Date.now()}-${safeName(value.name)}`;
    const { error: uploadError } = await admin.storage.from(VERIFICATION_DOCUMENTS_BUCKET).upload(path, value, {
      contentType: validation.contentType,
      upsert: false
    });

    if (uploadError) {
      go(`/seller/verification?message=${encodeURIComponent(userSafeErrorMessage(uploadError))}`);
    }

    await admin.from("seller_verification_documents").insert({
      farm_id: farmId,
      user_id: user.id,
      document_type: documentType,
      storage_path: path,
      file_name: value.name
    });
  }

  const { error: farmError } = await admin.from("farms").update(farmUpdate).eq("id", farmId);
  if (farmError) {
    go(`/seller/verification?message=${encodeURIComponent(userSafeErrorMessage(farmError))}`);
  }

  await admin.from("seller_verifications").upsert({
    user_id: user.id,
    seller_type: "business",
    account_role: "business_seller",
    business_name: businessName,
    phone_verified: false,
    email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
    email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null,
    document_status: "submitted",
    seller_verification_status: "documents_submitted",
    representative_name: farmUpdate.representative_name,
    representative_role: farmUpdate.representative_role,
    representative_email: farmUpdate.representative_email,
    representative_phone: farmUpdate.representative_phone
  }, { onConflict: "user_id" });

  await admin.from("app_notifications").insert({
    farm_id: farmId,
    title: "Business verification submitted",
    body: "Your documents were submitted. AgriMarketX will review them before facial verification is enabled.",
    type: "verification",
    link_url: "/seller/verification"
  });

  revalidatePath("/seller/verification");
  go("/seller/verification?message=Business verification submitted.");
}
