import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Private columns (farm contact/GPS/identity data, listing contact details,
 * exact coordinates) are not readable by anon/authenticated clients since
 * migration 036. Server code that legitimately needs them reads them with the
 * service role, but ONLY after one of the explicit checks below.
 */

/** Server-side admin check (defence in depth on top of the middleware). */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase.from("profiles").select("account_role").eq("id", user.id).maybeSingle();

  if (!["admin", "super_admin"].includes(profile?.account_role ?? "")) {
    redirect("/marketplace");
  }

  return { supabase, user, admin: createAdminClient() };
}

/** True when the signed-in user is a member of the farm (RLS-scoped check). */
export async function isFarmMember(farmId: string, roles?: string[]) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !farmId) {
    return false;
  }

  const { data } = await supabase
    .from("farm_members")
    .select("role")
    .eq("farm_id", farmId)
    .eq("user_id", user.id)
    .maybeSingle();

  return Boolean(data) && (!roles || roles.includes(String(data?.role)));
}

/**
 * Reads private columns of a farm the caller has already been verified to
 * belong to (e.g. via getCurrentFarm() or isFarmMember()).
 */
export async function readVerifiedFarmPrivateFields<T = Record<string, unknown>>(farmId: string, columns: string) {
  const { data, error } = await createAdminClient().from("farms").select(columns).eq("id", farmId).maybeSingle();

  if (error) {
    console.error(`[privileged-reads] farm ${columns}: ${error.message}`);
    return null;
  }

  return (data as T | null) ?? null;
}
