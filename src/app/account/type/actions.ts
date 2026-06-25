"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function go(path: string): never {
  redirect(path as never);
}

export async function chooseAccountType(formData: FormData) {
  const accountType = String(formData.get("accountType") ?? "buyer");
  const role = accountType === "seller" ? "seller" : "buyer";
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
    go(`/account/type?message=${encodeURIComponent(error.message)}`);
  }

  if (role === "seller") {
    go("/onboarding");
  }

  go("/marketplace");
}
