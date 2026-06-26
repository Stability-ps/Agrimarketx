import { redirect } from "next/navigation";
import { automaticSellerStatus, sellerTrustScore, type FarmSellerStatus } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";

export type SellerVerificationSummary = {
  status: FarmSellerStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustScore: number;
  adminOverride: boolean;
  rejectionReason: string | null;
  sellerAccountRole: string;
  diditSessionId: string | null;
  decision: string | null;
};

const defaultSummary: SellerVerificationSummary = {
  status: "not_started",
  emailVerified: false,
  phoneVerified: false,
  trustScore: 0,
  adminOverride: false,
  rejectionReason: null,
  sellerAccountRole: "farmer_seller",
  diditSessionId: null,
  decision: null
};

export async function getSellerVerificationSummary(userId: string): Promise<SellerVerificationSummary> {
  const supabase = await createClient();
  const [{ data }, { data: userData }, { data: farmRows }] = await Promise.all([
    supabase
    .from("seller_verifications")
      .select("status, didit_session_id, decision, email_verified, phone_verified, seller_verification_status, admin_verification_override, verification_rejection_reason, account_role")
    .eq("user_id", userId)
      .maybeSingle(),
    supabase.auth.getUser(),
    supabase
      .from("farm_members")
      .select("farms(email_verified, phone_verified, seller_verification_status, admin_verification_override, verification_rejection_reason, seller_account_role)")
      .eq("user_id", userId)
      .limit(1)
  ]);

  const authEmailVerified = Boolean(userData.user?.email_confirmed_at || userData.user?.confirmed_at);
  const farm = Array.isArray(farmRows?.[0]?.farms) ? farmRows?.[0]?.farms[0] : farmRows?.[0]?.farms;

  const emailVerified = Boolean(farm?.email_verified) || Boolean(data?.email_verified) || authEmailVerified;
  const phoneVerified = Boolean(farm?.phone_verified) || Boolean(data?.phone_verified);
  const adminOverride = Boolean(farm?.admin_verification_override) || Boolean(data?.admin_verification_override);
  const status = (
    farm?.seller_verification_status ??
    data?.seller_verification_status ??
    automaticSellerStatus(emailVerified, phoneVerified)
  ) as FarmSellerStatus;

  return {
    status,
    emailVerified,
    phoneVerified,
    trustScore: sellerTrustScore(emailVerified, phoneVerified),
    adminOverride,
    rejectionReason: farm?.verification_rejection_reason ?? data?.verification_rejection_reason ?? null,
    sellerAccountRole: farm?.seller_account_role ?? data?.account_role ?? "farmer_seller",
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
  if (verification.status === "rejected" || verification.status === "suspended") {
    redirect(`/seller/verification?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Your seller account has been suspended or rejected. Please contact AgriMarketX Support.")}` as never);
  }

  if (!verification.emailVerified || !verification.phoneVerified || verification.status !== "verified") {
    redirect(`/seller/verification?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Verify your email and mobile number before selling on AgriMarketX.")}` as never);
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
  if (verification.status === "rejected" || verification.status === "suspended") {
    redirect(`/seller/verification?next=${encodeURIComponent("/marketplace/wanted")}&message=${encodeURIComponent("Your seller account has been suspended or rejected. Please contact AgriMarketX Support.")}` as never);
  }

  if (!verification.emailVerified || !verification.phoneVerified || verification.status !== "verified") {
    redirect(`/seller/verification?next=${encodeURIComponent("/marketplace/wanted")}&message=${encodeURIComponent("Verify your email and mobile number before publishing marketplace requests.")}` as never);
  }
}
