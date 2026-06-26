"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACTIVE_FARM_COOKIE } from "@/lib/farm-cookie";
import { normalizeSupplyCategories } from "@/lib/supply-categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCoordinates(value: FormDataEntryValue | null) {
  const [lat, lng] = String(value ?? "")
    .split(",")
    .map((item) => Number(item.trim()));

  return {
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null
  };
}

function parseNumber(value: FormDataEntryValue | null) {
  const number = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function createFarm(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    go("/login?message=Please sign in before creating a farm.&next=/onboarding");
  }

  const farmName = String(formData.get("farmName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerPhone = String(formData.get("ownerPhone") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const farmType = String(formData.get("farmType") ?? "").trim();
  const facilities = splitList(formData.get("facilities"));
  const selectedSpecies = formData.getAll("species").map((item) => String(item));
  const supplyCategories = normalizeSupplyCategories(formData.getAll("supplyCategories").map((item) => String(item)));
  const next = String(formData.get("next") ?? "/dashboard");
  const sellerType = String(formData.get("sellerType") ?? "individual") === "business" ? "business" : "individual";
  const coordinates = parseCoordinates(formData.get("gpsCoordinates"));
  const sizeHectares = parseNumber(formData.get("sizeHectares"));

  if (!farmName) {
    go(`/onboarding?message=${encodeURIComponent("Farm name is required.")}`);
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: ownerName || user.user_metadata?.full_name || user.email,
    account_role: "seller",
    account_type_selected: true
  });

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: `${farmName} Company`,
      owner_id: user.id,
      country
    })
    .select("id")
    .single();

  if (companyError || !company) {
    go(`/onboarding?message=${encodeURIComponent(companyError?.message ?? "Could not create company.")}`);
  }

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .insert({
      company_id: company.id,
      name: farmName,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      location,
      province,
      country,
      gps_latitude: coordinates.latitude,
      gps_longitude: coordinates.longitude,
      size_hectares: sizeHectares,
      farm_type: farmType,
      seller_type: sellerType,
      seller_account_role: sellerType === "business" ? "business_seller" : "individual_seller",
      supply_categories: supplyCategories,
      facilities
    })
    .select("id")
    .single();

  if (farmError || !farm) {
    go(`/onboarding?message=${encodeURIComponent(farmError?.message ?? "Could not create farm.")}`);
  }

  const { error: memberError } = await supabase.from("farm_members").insert({
    farm_id: farm.id,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    go(`/onboarding?message=${encodeURIComponent(memberError.message)}`);
  }

  if (selectedSpecies.length > 0) {
    const { data: speciesRows, error: speciesError } = await supabase
      .from("species")
      .select("id,name")
      .in("name", selectedSpecies);

    if (speciesError) {
      go(`/onboarding?message=${encodeURIComponent(speciesError.message)}`);
    }

    const farmSpeciesRows = (speciesRows ?? []).map((species) => ({
      farm_id: farm.id,
      species_id: species.id,
      is_active: true
    }));

    if (farmSpeciesRows.length > 0) {
      const { error: farmSpeciesError } = await supabase.from("farm_species").insert(farmSpeciesRows);

      if (farmSpeciesError) {
        go(`/onboarding?message=${encodeURIComponent(farmSpeciesError.message)}`);
      }
    }
  }

  const admin = createAdminClient();
  await admin.from("seller_verifications").upsert({
    user_id: user.id,
    seller_type: sellerType,
    account_role: sellerType === "business" ? "business_seller" : "individual_seller",
    email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
    email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
  }, { onConflict: "user_id" });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FARM_COOKIE, farm.id, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });

  redirect((next.startsWith("/") ? next : "/dashboard") as never);
}
