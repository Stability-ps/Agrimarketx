import Link from "next/link";
import { CheckCircle2, Clock, Mail, Phone, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PhoneVerificationForm } from "@/components/verification/PhoneVerificationForm";
import { getSellerVerificationSummary } from "@/lib/seller-verification";
import { sellerAccountRoleLabel, sellerStatusLabel, sellerVerificationBadge } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";

export default async function SellerVerificationPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
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

  const role = profile?.account_role ?? "buyer";
  const summary = user ? await getSellerVerificationSummary(user.id) : null;
  const emailVerified = summary?.emailVerified ?? false;
  const phoneVerified = summary?.phoneVerified ?? false;
  const status = summary?.status ?? "not_started";
  const trustScore = summary?.trustScore ?? 0;
  const badge = sellerVerificationBadge(status, summary?.sellerAccountRole);
  const blocked = status === "rejected" || status === "suspended";

  return (
    <AppShell>
      <PageHeader title="Seller Verification" description="Verify your email and mobile number to unlock seller tools on AgriMarketX." />
      {message ? <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{message}</div> : null}

      {role === "buyer" ? (
        <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Buyers do not need seller verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can browse listings, save favourites and contact sellers as a buyer. Verification is only needed when you want to sell.
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
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Seller Trust Score</p>
                <h2 className="mt-1 text-4xl font-bold text-brand-green">{trustScore}/100</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {blocked
                    ? "Your seller account has been suspended or rejected. Please contact AgriMarketX Support."
                    : trustScore === 100
                      ? "Completed. Your seller profile is verified."
                      : "Verify your email and mobile number before publishing listings."}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold ${
                status === "verified" ? "bg-green-50 text-brand-green" : blocked ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
              }`}>
                {status === "verified" ? <ShieldCheck size={16} /> : blocked ? <XCircle size={16} /> : <Clock size={16} />}
                {sellerStatusLabel(status)}
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-green" style={{ width: `${trustScore}%` }} />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <VerificationSummaryCard icon={Mail} done={emailVerified} title="Email Verified" points="50 points" description="Completed when the signup email is confirmed." />
              <VerificationSummaryCard icon={Phone} done={phoneVerified} title="Mobile Number Verified" points="50 points" description="Completed with an SMS OTP code." />
            </div>

            <div className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Seller Status" value={sellerStatusLabel(status)} />
              <Info label="Account Role" value={sellerAccountRoleLabel(summary?.sellerAccountRole)} />
              <Info label="Verification Badge" value={badge ?? "Not shown yet"} />
              <Info label="Verification Date" value={status === "verified" ? "Saved on your seller profile" : "Not verified yet"} />
            </div>

            {blocked ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                Your seller tools are blocked for now. Please contact AgriMarketX Support so the team can review your account.
              </div>
            ) : (
              <div className="mt-6 max-w-xl">
                <h3 className="mb-2 font-bold">Mobile Verification</h3>
                <PhoneVerificationForm defaultPhone={profile?.phone} verified={phoneVerified} />
              </div>
            )}
          </section>
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
  icon: typeof Mail;
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-brand-navy">{value}</p>
    </div>
  );
}
