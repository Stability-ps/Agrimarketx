import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authAction = requestUrl.searchParams.get("authAction");
  const emailParam = requestUrl.searchParams.get("email");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";
  let redirectTo = next;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    if (type === "recovery" || authAction === "reset_password") {
      return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_role, account_type_selected")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    if (user && !profile) {
      const accountRole = user.user_metadata?.account_role === "seller" ? "seller" : "buyer";
      const sellerType = user.user_metadata?.seller_type === "business" ? "business" : "individual";
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        account_role: accountRole,
        account_type_selected: Boolean(user.user_metadata?.account_type_selected)
      });
      redirectTo = accountRole === "seller" ? `/onboarding?sellerType=${sellerType}` : "/account/type";
    } else if (profile && !profile.account_type_selected) {
      redirectTo = "/account/type";
    }

    if (user && user.user_metadata?.account_role === "seller") {
      const sellerType = user.user_metadata?.seller_type === "business" ? "business" : "individual";
      const admin = createAdminClient();
      await admin.from("seller_verifications").upsert({
        user_id: user.id,
        seller_type: sellerType,
        account_role: sellerType === "business" ? "business_seller" : "individual_seller",
        email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
        email_verified_at: user.email_confirmed_at ?? user.confirmed_at ?? null
      }, { onConflict: "user_id" });
    }

    if (authAction === "confirm_email") {
      const email = emailParam || user?.email || "";
      await supabase.auth.signOut();
      redirectTo = `/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Email confirmed successfully. Please log in to continue.")}`;
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
