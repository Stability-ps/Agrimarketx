"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanFileName, isImageFile, publicStorageUrl } from "@/lib/files";
import { ACTIVE_FARM_COOKIE } from "@/lib/farm-cookie";
import { getCurrentFarm } from "@/lib/farm-server";
import { normalizeSupplyCategories } from "@/lib/supply-categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  const number = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function setActiveFarmCookie(farmId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FARM_COOKIE, farmId, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });
}

async function uploadImage(file: File, folder: string) {
  const supabase = await createClient();

  if (!isImageFile(file)) {
    throw new Error("Please upload an image file.");
  }

  const path = `${folder}/${Date.now()}-${cleanFileName(file.name)}`;
  const { error } = await supabase.storage.from("farm-assets").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw error;
  }

  return publicStorageUrl("farm-assets", path);
}

export async function updateProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("profilePhoto");
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !(file instanceof File) || file.size === 0) {
    go(`/settings?message=${encodeURIComponent("Choose a profile photo to upload.")}`);
  }

  try {
    const avatarUrl = await uploadImage(file, `profiles/${user.id}`);
    const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    go(`/settings?message=${encodeURIComponent(error instanceof Error ? error.message : "Could not upload profile photo.")}`);
  }

  revalidatePath("/settings");
  go(`/settings?message=${encodeURIComponent("Profile photo updated.")}`);
}

export async function updateProfileDetails(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go("/login");
  }

  const fullName = nullableText(formData, "fullName");
  const email = nullableText(formData, "email") || user.email;
  const phone = nullableText(formData, "phone");
  const whatsappNumber = nullableText(formData, "whatsappNumber");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    email,
    phone,
    whatsapp_number: whatsappNumber,
    updated_at: new Date().toISOString()
  });

  if (error) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  go(`/settings?message=${encodeURIComponent("Profile details saved.")}`);
}

export async function updateFarmLogo(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const file = formData.get("farmLogo");

  if (!(file instanceof File) || file.size === 0) {
    go(`/settings?message=${encodeURIComponent("Choose a farm logo to upload.")}`);
  }

  try {
    const logoUrl = await uploadImage(file, `farms/${farm.id}`);
    const { error } = await supabase.from("farms").update({ logo_url: logoUrl }).eq("id", farm.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    go(`/settings?message=${encodeURIComponent(error instanceof Error ? error.message : "Could not upload farm logo.")}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  go(`/settings?message=${encodeURIComponent("Farm logo updated.")}`);
}

export async function updateFarmDetails(formData: FormData) {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const name = text(formData, "farmName");

  if (!name) {
    go(`/settings?message=${encodeURIComponent("Farm name is required.")}`);
  }

  const { error } = await supabase
    .from("farms")
    .update({
      name,
      owner_name: nullableText(formData, "ownerName"),
      owner_phone: nullableText(formData, "ownerPhone"),
      location: nullableText(formData, "location"),
      province: nullableText(formData, "province"),
      country: nullableText(formData, "country"),
      gps_latitude: parseNumber(text(formData, "gpsLatitude")),
      gps_longitude: parseNumber(text(formData, "gpsLongitude")),
      size_hectares: parseNumber(text(formData, "sizeHectares")),
      farm_type: nullableText(formData, "farmType"),
      supply_categories: normalizeSupplyCategories(formData.getAll("supplyCategories").map((item) => String(item))),
      description: nullableText(formData, "description"),
      facilities: splitList(text(formData, "facilities")),
      updated_at: new Date().toISOString()
    })
    .eq("id", farm.id);

  if (error) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/");
  go(`/settings?message=${encodeURIComponent("Farm details saved.")}`);
}

export async function switchActiveFarm(formData: FormData) {
  const supabase = await createClient();
  const farmId = text(formData, "farmId");
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !farmId) {
    go("/login");
  }

  const { data, error } = await supabase
    .from("farm_members")
    .select("farm_id")
    .eq("user_id", user.id)
    .eq("farm_id", farmId)
    .maybeSingle();

  if (error || !data) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(error, "You do not have access to that farm."))}`);
  }

  await setActiveFarmCookie(farmId);
  revalidatePath("/");
  go(`/settings?message=${encodeURIComponent("Active farm changed.")}`);
}

export async function createAdditionalFarm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go("/login");
  }

  const farmName = text(formData, "farmName");
  const country = nullableText(formData, "country");
  const admin = createAdminClient();

  if (!farmName) {
    go(`/settings?message=${encodeURIComponent("New farm name is required.")}`);
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    account_role: "seller",
    account_type_selected: true
  });

  const { data: existingVerification } = await admin
    .from("seller_verifications")
    .select("seller_type")
    .eq("user_id", user.id)
    .maybeSingle();
  const sellerType = existingVerification?.seller_type === "business" ? "business" : "individual";

  let { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (companyError) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(companyError))}`);
  }

  if (!company) {
    const created = await supabase
      .from("companies")
      .insert({
        name: `${farmName} Company`,
        owner_id: user.id,
        country
      })
      .select("id")
      .single();

    company = created.data;
    companyError = created.error;
  }

  if (companyError || !company) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(companyError, "Could not prepare company account."))}`);
  }

  const { data: newFarm, error: farmError } = await supabase
    .from("farms")
    .insert({
      company_id: company.id,
      name: farmName,
      owner_name: nullableText(formData, "ownerName"),
      owner_phone: nullableText(formData, "ownerPhone"),
      location: nullableText(formData, "location"),
      province: nullableText(formData, "province"),
      country,
      farm_type: nullableText(formData, "farmType"),
      seller_type: sellerType,
      seller_account_role: sellerType === "business" ? "business_seller" : "individual_seller",
      supply_categories: normalizeSupplyCategories(formData.getAll("supplyCategories").map((item) => String(item))),
      facilities: splitList(text(formData, "facilities"))
    })
    .select("id")
    .single();

  if (farmError || !newFarm) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(farmError, "Could not create farm."))}`);
  }

  const { error: memberError } = await supabase.from("farm_members").insert({
    farm_id: newFarm.id,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(memberError))}`);
  }

  await setActiveFarmCookie(newFarm.id);
  await admin.from("seller_verifications").upsert({
    user_id: user.id,
    seller_type: sellerType,
    account_role: sellerType === "business" ? "business_seller" : "individual_seller",
    email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
    email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
  }, { onConflict: "user_id" });
  revalidatePath("/");
  go(`/settings?message=${encodeURIComponent("New farm created and selected.")}`);
}

export async function deleteProfilePhoto() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go("/login");
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  if (error) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  go(`/settings?message=${encodeURIComponent("Profile picture deleted.")}`);
}

export async function deleteFarmLogo() {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const { error } = await supabase.from("farms").update({ logo_url: null }).eq("id", farm.id);

  if (error) {
    go(`/settings?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  go(`/settings?message=${encodeURIComponent("Farm logo deleted.")}`);
}
