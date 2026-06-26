import { redirect } from "next/navigation";
import { identityTrustScore, type SellerVerificationStatus } from "@/lib/didit";
import { createClient } from "@/lib/supabase/server";

export type SellerVerificationSummary = {
  status: SellerVerificationStatus;
  trustScore: number;
  diditSessionId: string | null;
  decision: string | null;
};

const defaultSummary: SellerVerificationSummary = {
  status: "not_started",
  trustScore: 0,
  diditSessionId: null,
  decision: null
};

export async function getSellerVerificationSummary(userId: string): Promise<SellerVerificationSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_verifications")
    .select("status, didit_session_id, decision")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return defaultSummary;
  }

  const status = (data.status ?? "not_started") as SellerVerificationStatus;

  return {
    status,
    trustScore: identityTrustScore(status),
    diditSessionId: data.didit_session_id ?? null,
    decision: data.decision ?? null
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
  if (verification.status !== "approved") {
    redirect(`/seller/verification?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Verify your identity before selling on AgriMarketX.")}` as never);
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
  if (verification.status !== "approved") {
    redirect(`/seller/verification?next=${encodeURIComponent("/marketplace/wanted")}&message=${encodeURIComponent("Verify your seller identity before publishing marketplace requests.")}` as never);
  }
}
