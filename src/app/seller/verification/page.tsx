import Link from "next/link";
import { CheckCircle2, ChevronDown, Clock, IdCard, Mail, Phone, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DiditVerificationActions } from "@/components/verification/DiditVerificationActions";
import { PhoneVerificationForm } from "@/components/verification/PhoneVerificationForm";
import { type SellerVerificationStatus } from "@/lib/didit";
import { getOptionalCurrentFarm } from "@/lib/farm-server";
import { getSellerVerificationSummary } from "@/lib/seller-verification";
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
        .select("status, decision, verification_score, email_verified, email_verified_at, phone_verified, phone_verified_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const role = profile?.account_role ?? "buyer";
  const summary = user ? await getSellerVerificationSummary(user.id) : null;
  const status = (verification?.status ?? "not_started") as SellerVerificationStatus;
  const identityVerified = summary?.identityVerified ?? false;
  const emailVerified = summary?.emailVerified ?? false;
  const phoneVerified = summary?.phoneVerified ?? false;
  const trustScore = summary?.trustScore ?? 0;
  const checklist = [
    ["Government ID", status !== "not_started"],
    ["Selfie and liveness", status !== "not_started"],
    ["Face match", status !== "not_started"],
    ["Identity Verified", identityVerified]
  ] as const;

  return (
    <AppShell>
      <PageHeader title="Seller Verification" description="Complete identity, email and mobile verification to unlock selling on AgriMarketX." />
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
        <div className="grid gap-5">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overall Progress</p>
                <h2 className="mt-1 text-4xl font-bold text-brand-green">{trustScore}%</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {trustScore === 100 ? "Completed. Your seller profile is fully verified." : "Complete all three verification steps before publishing listings."}
                </p>
              </div>
              {trustScore === 100 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-2 text-sm font-bold text-brand-green">
                  <ShieldCheck size={16} />
                  Fully Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                  <Clock size={16} />
                  In progress
                </span>
              )}
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-green" style={{ width: `${trustScore}%` }} />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <VerificationSummaryCard icon={ShieldCheck} done={identityVerified} title="Identity Verified" points="60 points" description="Government ID, selfie, liveness and face match." />
              <VerificationSummaryCard icon={Mail} done={emailVerified} title="Email Verified" points="20 points" description="Completed during signup confirmation." />
              <VerificationSummaryCard icon={Phone} done={phoneVerified} title="Mobile Number Verified" points="20 points" description="SMS OTP verification with Twilio Verify." />
            </div>

            {verification?.decision && status !== "approved" ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Didit decision: {verification.decision}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-4">
                <h3 className="font-bold">Identity Verification</h3>
                <p className="mt-1 text-sm text-slate-600">{statusDescriptions[status]}</p>
                {identityVerified ? (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-sm font-bold text-brand-green"><CheckCircle2 size={16} /> Identity verified</p>
                ) : (
                  <div className="mt-4">
                    <DiditVerificationActions label={status === "declined" || status === "resubmission_required" ? "Resubmit Verification" : "Start Verification"} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 font-bold">Mobile Verification</h3>
                <PhoneVerificationForm defaultPhone={profile?.phone} verified={phoneVerified} />
              </div>
            </div>
          </section>

          <details className="rounded-md border border-slate-200 bg-white p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-2">
              <IdCard className="text-brand-green" />
                <span className="font-bold">Didit identity checklist</span>
              </span>
              <ChevronDown size={18} className="text-slate-500" />
            </summary>
            <div className="mt-4 grid gap-2">
              {checklist.map(([label, done]) => (
                <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
                  {done ? <CheckCircle2 className="text-brand-green" size={20} /> : <XCircle className="text-slate-400" size={20} />}
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </AppShell>
  );
}

function VerificationSummaryCard({
  icon: Icon,
  done,
  title,
  points,
  description
}: {
  icon: typeof ShieldCheck;
  done: boolean;
  title: string;
  points: string;
  description: string;
}) {
  return (
    <div className={`rounded-md border p-4 ${done ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? "bg-white text-brand-green" : "bg-white text-slate-400"}`}>
          {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
        </span>
        <div>
          <p className="font-bold text-brand-navy">{done ? "✓ " : ""}{title}</p>
          <p className="mt-1 text-sm font-bold text-brand-green">{points}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
