import { userSafeErrorMessage } from "@/lib/user-errors";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_FARM_COOKIE } from "@/lib/farm-cookie";

export type CurrentFarm = {
  id: string;
  name: string;
  role: string;
};

async function loadCurrentFarm(): Promise<CurrentFarm | null> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeFarmId = cookieStore.get(ACTIVE_FARM_COOKIE)?.value;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("farm_members")
    .select("role, farms(id, name)")
    .eq("user_id", user.id);

  if (activeFarmId) {
    query = query.eq("farm_id", activeFarmId);
  }

  let { data, error } = await query.limit(1).maybeSingle();

  if (!data && activeFarmId && !error) {
    const fallback = await supabase
      .from("farm_members")
      .select("role, farms(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    redirect(`/onboarding?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  const farm = Array.isArray(data?.farms) ? data?.farms[0] : data?.farms;

  if (!data || !farm?.id) {
    return null;
  }

  return {
    id: farm.id,
    name: farm.name,
    role: data.role
  };
}

export async function getOptionalCurrentFarm(): Promise<CurrentFarm | null> {
  return loadCurrentFarm();
}

export async function getCurrentFarm(): Promise<CurrentFarm> {
  const farm = await loadCurrentFarm();

  if (!farm) {
    redirect("/onboarding");
  }

  return farm;
}

export async function getFarmSpecies(farmId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_species")
    .select("species(id, name, young_name, adult_female_name, adult_male_name, gestation_period_days)")
    .eq("farm_id", farmId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? [])
    .map((row) => (Array.isArray(row.species) ? row.species[0] : row.species))
    .filter(Boolean);
}
