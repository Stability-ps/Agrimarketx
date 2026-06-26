import { redirect } from "next/navigation";
import { identityTrustScore, type SellerVerificationStatus } from "@/lib/didit";
import { createClient } from "@/lib/supabase/server";

export type SellerVerificationSummary = {
  status: SellerVerificationStatus;
  identityVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustScore: number;
  diditSessionId: string | null;
  decision: string | null;
};

const defaultSummary: SellerVerificationSummary = {
  status: "not_started",
  identityVerified: false,
  emailVerified: false,
  phoneVerified: false,
  trustScore: 0,
  diditSessionId: null,
  decision: null
};

export async function getSellerVerificationSummary(userId: string): Promise<SellerVerificationSummary> {
  const supabase = await createClient();
  const [{ data }, { data: userData }] = await Promise.all([
    supabase
    .from("seller_verifications")
      .select("status, didit_session_id, decision, email_verified, phone_verified")
    .eq("user_id", userId)
      .maybeSingle(),
    supabase.auth.getUser()
  ]);

  const authEmailVerified = Boolean(userData.user?.email_confirmed_at || userData.user?.confirmed_at);

  const status = (data?.status ?? "not_started") as SellerVerificationStatus;
  const identityVerified = status === "approved";
  const emailVerified = Boolean(data?.email_verified) || authEmailVerified;
  const phoneVerified = Boolean(data?.phone_verified);

  return {
    status,
    identityVerified,
    emailVerified,
    phoneVerified,
    trustScore: identityTrustScore(status) + (emailVerified ? 20 : 0) + (phoneVerified ? 20 : 0),
    diditSessionId: data?.didit_session_id ?? null,
    decision: data?.decision ?? null
  };
}

export async function requireApprovedSellerVerification(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}` as never);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.account_role ?? "buyer";

  if (role === "admin" || role === "super_admin") {
    return;
  }

  if (role !== "seller") {
    return;
  }

  const verification = await getSellerVerificationSummary(user.id);
  if (!verification.identityVerified || !verification.emailVerified || !verification.phoneVerified) {
    redirect(`/seller/verification?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Complete identity, email and mobile verification before selling on AgriMarketX.")}` as never);
  }
}

export async function requireVerifiedSellerForWantedRequest() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_role !== "seller") {
    return;
  }

  const verification = await getSellerVerificationSummary(user.id);
  if (!verification.identityVerified || !verification.emailVerified || !verification.phoneVerified) {
    redirect(`/seller/verification?next=${encodeURIComponent("/marketplace/wanted")}&message=${encodeURIComponent("Complete identity, email and mobile verification before publishing marketplace requests.")}` as never);
  }
}
