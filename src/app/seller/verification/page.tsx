import Link from "next/link";
import { CheckCircle2, Clock, IdCard, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DiditVerificationActions } from "@/components/verification/DiditVerificationActions";
import { identityTrustScore, type SellerVerificationStatus } from "@/lib/didit";
import { getOptionalCurrentFarm } from "@/lib/farm-server";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<SellerVerificationStatus, string> = {
  not_started: "Not Started",
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  resubmission_required: "Resubmission Required"
};

const statusDescriptions: Record<SellerVerificationStatus, string> = {
  not_started: "Start identity verification to unlock seller trust and publishing tools.",
  pending: "Your Didit verification is in progress. This usually updates automatically after completion.",
  approved: "Your identity is verified. Buyers will see an Identity Verified trust badge.",
  declined: "Didit could not approve this verification. You can resubmit with clearer or updated documents.",
  resubmission_required: "Didit needs another submission before your seller identity can be approved."
};

export default async function SellerVerificationPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; didit?: string }>;
}) {
  const { message, didit } = await searchParams;
  const supabase = await createClient();
  const farm = await getOptionalCurrentFarm();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email, phone, account_role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const { data: verification } = user
    ? await supabase
        .from("seller_verifications")
        .select("status, decision, verification_score, updated_at")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const role = profile?.account_role ?? "buyer";
  const status = (verification?.status ?? "not_started") as SellerVerificationStatus;
  const trustScore = identityTrustScore(status);
  const checklist = [
    ["Government ID", status !== "not_started"],
    ["Selfie and liveness", status !== "not_started"],
    ["Face match", status !== "not_started"],
    ["Identity Verified", status === "approved"]
  ] as const;

  return (
    <AppShell>
      <PageHeader title="Seller Identity Verification" description="Verify your identity with Didit to build trust before selling on AgriMarketX." />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}
      {didit === "return" && status === "pending" ? (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
          Thanks. We are waiting for Didit to send the final result.
        </div>
      ) : null}

      {role === "buyer" ? (
        <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Buyers do not need identity verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can browse listings, save items, follow farms and contact sellers as a buyer. Verification is only needed when you want to sell.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/marketplace" className="secondary-button">Browse marketplace</Link>
            <Link href="/onboarding" className="primary-button">Start selling</Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current status</p>
                <h2 className="mt-1 text-2xl font-bold text-brand-navy">{statusLabels[status]}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{statusDescriptions[status]}</p>
              </div>
              {status === "approved" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-2 text-sm font-bold text-brand-green">
                  <ShieldCheck size={16} />
                  Identity Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                  <Clock size={16} />
                  {statusLabels[status]}
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Trust Score</p>
                <p className="mt-1 text-2xl font-bold text-brand-green">{trustScore}/100</p>
                <p className="mt-1 text-sm text-slate-600">20 points are awarded for Didit Identity Verified.</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Farm</p>
                <p className="mt-1 font-bold text-brand-navy">{farm?.name ?? "No active farm selected"}</p>
                <p className="mt-1 text-sm text-slate-600">Verification is linked to your seller account and shown on your seller/farm profile.</p>
              </div>
            </div>

            {verification?.decision && status !== "approved" ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Didit decision: {verification.decision}
              </p>
            ) : null}

            {status === "approved" ? null : (
              <div className="mt-5">
                <DiditVerificationActions label={status === "declined" || status === "resubmission_required" ? "Resubmit Verification" : "Start Verification"} />
              </div>
            )}
          </section>

          <aside className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <IdCard className="text-brand-green" />
              <h3 className="font-bold">Verification progress</h3>
            </div>
            <div className="mt-4 grid gap-2">
              {checklist.map(([label, done]) => (
                <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                  {done ? <CheckCircle2 className="text-brand-green" size={20} /> : <XCircle className="text-slate-400" size={20} />}
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
