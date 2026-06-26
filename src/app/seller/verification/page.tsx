import Link from "next/link";
import { Building2, CheckCircle2, Clock, FileText, Mail, Phone, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { DiditVerificationActions } from "@/components/verification/DiditVerificationActions";
import { PhoneVerificationForm } from "@/components/verification/PhoneVerificationForm";
import { southAfricanProvinces } from "@/lib/location-options";
import { getSellerVerificationSummary } from "@/lib/seller-verification";
import { sellerStatusLabel, sellerVerificationBadge } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";
import { submitBusinessVerification } from "./actions";

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

  const { data: membership } = user
    ? await supabase
        .from("farm_members")
        .select(`
          farm_id,
          farms(
            id,
            name,
            owner_name,
            owner_phone,
            location,
            province,
            city,
            seller_type,
            business_name,
            trading_name,
            registration_number,
            vat_number,
            contact_person,
            contact_person_position,
            physical_address,
            business_type,
            business_description,
            representative_name,
            representative_role,
            representative_email,
            representative_phone
          )
        `)
        .eq("user_id", user.id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle()
    : { data: null };
  const farm = Array.isArray(membership?.farms) ? membership?.farms[0] : membership?.farms;
  const { data: documents } = farm?.id
    ? await supabase
        .from("seller_verification_documents")
        .select("id, document_type, file_name, created_at")
        .eq("farm_id", farm.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const role = profile?.account_role ?? "buyer";
  const summary = user ? await getSellerVerificationSummary(user.id) : null;
  const emailVerified = summary?.emailVerified ?? false;
  const phoneVerified = summary?.phoneVerified ?? false;
  const status = summary?.status ?? "not_started";
  const sellerType = summary?.sellerType ?? farm?.seller_type ?? "individual";
  const documentStatus = summary?.documentStatus ?? "not_submitted";
  const facialStatus = summary?.facialVerificationStatus ?? "not_started";
  const trustScore = summary?.trustScore ?? 0;
  const badge = sellerVerificationBadge(status, summary?.sellerAccountRole, sellerType, summary?.sponsoredPartner);
  const blocked = status === "rejected" || status === "suspended";
  const canStartFacial = !blocked && emailVerified && phoneVerified && (
    sellerType === "individual" || documentStatus === "approved"
  );

  return (
    <AppShell>
      <PageHeader title="Seller Verification" description="Complete the trust checks needed to publish listings on AgriMarketX." />
      {message ? <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{message}</div> : null}

      {role === "buyer" ? (
        <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Buyers do not need seller verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Verification is only needed when you want to sell. You can still browse, save listings and contact sellers as a buyer.
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
                  {trustScore === 100
                    ? "Completed. Your seller profile can publish marketplace listings."
                    : "Complete email, mobile, documents where needed, and Didit facial verification to unlock selling."}
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

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <VerificationSummaryCard icon={Mail} done={emailVerified} title="Email Verified" points="20 points" />
              <VerificationSummaryCard icon={Phone} done={phoneVerified} title="Mobile Number Verified" points="20 points" />
              <VerificationSummaryCard icon={FileText} done={sellerType === "individual" || documentStatus === "approved"} title="Documents" points={sellerType === "business" ? "20 points" : "Not required"} />
              <VerificationSummaryCard icon={ShieldCheck} done={facialStatus === "verified"} title="Didit Identity & Face Match" points={sellerType === "business" ? "40 points" : "60 points"} />
            </div>

            <div className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Seller Type" value={sellerType === "business" ? "Business Seller" : "Individual Seller"} />
              <Info label="Document Status" value={documentStatus.replaceAll("_", " ")} />
              <Info label="Facial Status" value={facialStatus.replaceAll("_", " ")} />
              <Info label="Marketplace Badge" value={badge ?? "Not shown yet"} />
            </div>

            {blocked ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                Your seller tools are blocked for now. Please contact AgriMarketX Support so the team can review your account.
              </div>
            ) : null}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h3 className="font-bold">Mobile Verification</h3>
              <p className="mt-1 text-sm text-slate-600">Verify the seller mobile number with an SMS OTP.</p>
              <div className="mt-4">
                <PhoneVerificationForm defaultPhone={profile?.phone ?? farm?.owner_phone} verified={phoneVerified} />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-5">
              <h3 className="font-bold">Didit Identity Verification</h3>
              <p className="mt-1 text-sm text-slate-600">
                {sellerType === "business" && documentStatus !== "approved"
                  ? "Business sellers can complete facial verification after admin approves the uploaded documents."
                  : "Complete government ID, selfie, liveness and face match checks securely with Didit."}
              </p>
              <div className="mt-4">
                {canStartFacial && facialStatus !== "verified" ? (
                  <DiditVerificationActions label={facialStatus === "failed" ? "Resubmit Facial Verification" : "Complete Facial Verification"} />
                ) : facialStatus === "verified" ? (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-900">
                    <CheckCircle2 size={18} /> Didit identity verification complete
                  </div>
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                    {emailVerified && phoneVerified ? "Waiting for the required previous step." : "Verify email and mobile number first."}
                  </div>
                )}
              </div>
            </div>
          </section>

          {sellerType === "business" ? (
            <BusinessVerificationForm farm={farm} documents={documents ?? []} />
          ) : (
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-1 text-brand-green" size={22} />
                <div>
                  <h3 className="font-bold">Individual Seller</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Individual sellers only need email verification, mobile verification and Didit identity verification.
                    This seller type does not limit what you can sell on the marketplace.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function BusinessVerificationForm({ farm, documents }: { farm: any; documents: any[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 text-brand-green" size={22} />
        <div>
          <h3 className="font-bold">Business Seller Documents</h3>
          <p className="mt-1 text-sm text-slate-600">Submit business details and supporting documents for admin review.</p>
        </div>
      </div>

      {documents.length > 0 ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
          <p className="font-bold">Uploaded documents</p>
          <div className="mt-2 grid gap-2">
            {documents.map((document) => (
              <div key={document.id} className="rounded-md border border-slate-200 bg-white p-2">
                <span className="font-semibold">{String(document.document_type).replaceAll("_", " ")}</span>
                <span className="text-slate-500"> · {document.file_name ?? "Uploaded file"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <form action={submitBusinessVerification} className="mt-5 grid gap-4" encType="multipart/form-data">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="businessName" label="Business Name" defaultValue={farm?.business_name ?? farm?.name} required />
          <Field name="tradingName" label="Trading Name" defaultValue={farm?.trading_name} />
          <Field name="registrationNumber" label="Registration Number" defaultValue={farm?.registration_number} />
          <Field name="vatNumber" label="VAT Number" defaultValue={farm?.vat_number} />
          <Field name="contactPerson" label="Contact Person" defaultValue={farm?.contact_person ?? farm?.owner_name} required />
          <Field name="contactPersonPosition" label="Position" defaultValue={farm?.contact_person_position} />
          <Field name="phone" label="Phone" defaultValue={farm?.owner_phone} required />
          <label className="grid gap-1 text-sm font-bold">
            Province
            <select className="field" name="province" defaultValue={farm?.province ?? ""} required>
              <option value="">Select province</option>
              {southAfricanProvinces.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </label>
          <Field name="city" label="City" defaultValue={farm?.city ?? farm?.location} required />
          <Field name="physicalAddress" label="Physical Address" defaultValue={farm?.physical_address} />
          <Field name="businessType" label="Business Type" defaultValue={farm?.business_type} placeholder="Feed store, vet clinic, equipment dealer" />
          <Field name="representativeName" label="Representative Name" defaultValue={farm?.representative_name ?? farm?.contact_person ?? farm?.owner_name} />
          <Field name="representativeRole" label="Representative Role" defaultValue={farm?.representative_role ?? farm?.contact_person_position} />
          <Field name="representativeEmail" label="Representative Email" defaultValue={farm?.representative_email} />
          <Field name="representativePhone" label="Representative Phone" defaultValue={farm?.representative_phone ?? farm?.owner_phone} />
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Business Description
          <textarea className="field min-h-24" name="businessDescription" defaultValue={farm?.business_description ?? ""} />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <FileField name="businessRegistration" label="Business Registration" />
          <FileField name="representativeId" label="Representative ID / Passport" />
          <FileField name="businessAddress" label="Business Address Proof" />
        </div>
        <button className="primary-button w-full md:w-fit" type="submit">Submit Business Verification</button>
      </form>
    </section>
  );
}

function VerificationSummaryCard({
  icon: Icon,
  done,
  title,
  points
}: {
  icon: typeof Mail;
  done: boolean;
  title: string;
  points: string;
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
        </div>
      </div>
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder, required }: { name: string; label: string; defaultValue?: string | null; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input className="field" name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
    </label>
  );
}

function FileField({ name, label }: { name: string; label: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input className="field" type="file" name={name} accept=".pdf,image/*" />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-bold capitalize text-brand-navy">{value}</p>
    </div>
  );
}
