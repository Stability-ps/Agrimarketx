"use server";

import { userSafeErrorMessage } from "@/lib/user-errors";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

export async function chooseAccountType(formData: FormData) {
  const accountType = String(formData.get("accountType") ?? "buyer");
  const role = accountType === "seller" ? "seller" : "buyer";
  const sellerType = String(formData.get("sellerType") ?? "individual") === "business" ? "business" : "individual";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    go(`/login?next=${encodeURIComponent("/account/type")}`);
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    account_role: role,
    account_type_selected: true
  });

  if (error) {
    go(`/account/type?message=${encodeURIComponent(userSafeErrorMessage(error))}`);
  }

  if (role === "seller") {
    const admin = createAdminClient();
    const sellerAccountRole = sellerType === "business" ? "business_seller" : "individual_seller";
    await admin.from("seller_verifications").upsert({
      user_id: user.id,
      seller_type: sellerType,
      account_role: sellerAccountRole,
      email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
      email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
    }, { onConflict: "user_id" });

    const { data: memberships } = await admin
      .from("farm_members")
      .select("farm_id")
      .eq("user_id", user.id);
    const farmIds = (memberships ?? []).map((membership) => membership.farm_id).filter(Boolean);

    if (farmIds.length > 0) {
      await admin
        .from("farms")
        .update({
          seller_type: sellerType,
          seller_account_role: sellerAccountRole
        })
        .in("id", farmIds);
      go(`/seller/verification?message=${encodeURIComponent("Seller type updated. Your farms and listings were kept unchanged.")}`);
    }

    go(`/onboarding?sellerType=${sellerType}`);
  }

  go(`/marketplace?message=${encodeURIComponent("Buyer mode enabled. Your existing farms and listings were kept unchanged.")}`);
}
