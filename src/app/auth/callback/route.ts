import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/onboarding";
  let redirectTo = next;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type_selected")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    if (user && !profile) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        account_role: "buyer",
        account_type_selected: false
      });
      redirectTo = "/account/type";
    } else if (profile && !profile.account_type_selected) {
      redirectTo = "/account/type";
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
