import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOptionalCurrentFarm } from "@/lib/farm-server";
import { submitSellerVerification } from "../actions";

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  pending_review: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended"
};

export default async function VerificationCentrePage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const farm = await getOptionalCurrentFarm();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const { data: farmRecord } = farm?.id
    ? await supabase
        .from("farms")
        .select("name, owner_phone, location, province, country, farm_type, seller_verification_status, seller_verification_reason")
        .eq("id", farm.id)
        .maybeSingle()
    : { data: null };
  const status = farmRecord?.seller_verification_status ?? "not_started";
  const checklist = [
    ["Email verified", Boolean(profile?.email || user?.email)],
    ["Phone verified", Boolean(profile?.phone || farmRecord?.owner_phone)],
    ["Farm details completed", Boolean(farmRecord?.name && (farmRecord.location || farmRecord.province || farmRecord.country) && farmRecord.farm_type)],
    ["ID verification submitted", status !== "not_started"],
    ["Seller verification status", status === "verified"]
  ] as const;

  return (
    <AppShell>
      <PageHeader title="Verification Centre" description="Build buyer trust with simple seller verification." />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      {!farm ? (
        <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
          <h3 className="font-bold">Seller verification starts with a farm</h3>
          <p className="mt-2 text-sm text-slate-600">Your buyer account can keep browsing, saving and messaging. When you are ready to sell, create a farm profile first, then submit verification.</p>
          <a href="/account/type" className="primary-button mt-4 inline-flex">Start selling</a>
        </section>
      ) : (
      <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">{farmRecord?.name ?? farm.name}</h3>
            <p className="mt-1 text-sm text-slate-600">Current status: {statusLabels[status] ?? status}</p>
          </div>
          {status === "verified" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-2 text-sm font-bold text-green-800">
              <ShieldCheck size={16} />
              Verified Seller
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
              <Clock size={16} />
              {statusLabels[status] ?? status}
            </span>
          )}
        </div>
        {farmRecord?.seller_verification_reason ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{farmRecord.seller_verification_reason}</p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {checklist.map(([label, done]) => (
            <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
              {done ? <CheckCircle2 className="text-brand-green" size={20} /> : <XCircle className="text-slate-400" size={20} />}
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>
        {status === "verified" ? null : (
          <form action={submitSellerVerification} className="mt-5">
            <button className="primary-button w-full sm:w-fit" type="submit">
              {status === "pending_review" ? "Resubmit verification" : "Submit verification"}
            </button>
          </form>
        )}
      </section>
      )}
    </AppShell>
  );
}
