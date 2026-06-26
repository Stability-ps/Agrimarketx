import { CheckCircle2, CircleAlert, Phone, ShieldCheck, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { sellerAccountRoleLabel, sellerStatusLabel } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";
import { updateSellerVerification } from "../actions";

const statusOptions = [
  ["pending", "Pending"],
  ["documents_submitted", "Documents Submitted"],
  ["documents_approved_pending_facial_verification", "Documents Approved"],
  ["facial_verification_pending", "Facial Verification Pending"],
  ["verified", "Verified"],
  ["more_information_required", "More Information Required"],
  ["rejected", "Rejected"],
  ["suspended", "Suspended"]
] as const;

const sellerRoleOptions = [
  ["individual_seller", "Individual Seller"],
  ["business_seller", "Business Seller"],
  ["sponsored_partner", "Sponsored Partner"],
  ["farmer_seller", "Farmer Seller"],
  ["shop_seller", "Shop Seller"],
  ["service_provider", "Service Provider"],
  ["advertiser", "Advertiser"],
  ["admin_created_seller", "Admin Created Seller"],
  ["super_admin", "Super Admin"]
] as const;

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const { data: farms } = await supabase
    .from("farms")
    .select(`
      id,
      name,
      owner_name,
      owner_phone,
      location,
      province,
      country,
      logo_url,
      email_verified,
      phone_verified,
      seller_verification_status,
      seller_verification_reason,
      admin_verification_override,
      verification_rejection_reason,
      verification_updated_at,
      seller_verified_at,
      seller_account_role,
      seller_type,
      document_status,
      facial_verification_status,
      business_name,
      contact_person,
      city,
      representative_name,
      representative_role,
      representative_email,
      representative_phone,
      representative_verification_status,
      representative_verification_required,
      verification_email_sent_at,
      facial_email_sent_at,
      verification_email_status,
      facial_email_status,
      sponsored_partner,
      seller_verification_documents(id, document_type, file_name, created_at)
    `)
    .order("verification_updated_at", { ascending: false, nullsFirst: false })
    .limit(120);

  return (
    <AppShell>
      <PageHeader title="Verifications" description="Manage saved seller verification status, account role and marketplace trust badges." />
      <AdminNav />
      <div className="grid gap-3 lg:grid-cols-2">
        {(farms ?? []).map((farm) => {
          const status = farm.seller_verification_status ?? "not_started";
          const blocked = status === "rejected" || status === "suspended";

          return (
            <section key={farm.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{farm.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {[farm.location, farm.province, farm.country].filter(Boolean).join(", ") || "No location"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Owner: {farm.owner_name || "Not set"} {farm.owner_phone ? `· ${farm.owner_phone}` : ""}</p>
                  {farm.business_name ? <p className="mt-1 text-sm font-semibold text-brand-navy">Business: {farm.business_name}</p> : null}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                  status === "verified" ? "bg-green-50 text-brand-green" : blocked ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                }`}>
                  {sellerStatusLabel(status)}
                </span>
              </div>

              {(farm.seller_verification_reason || farm.verification_rejection_reason) ? (
                <p className="mt-3 rounded-md bg-amber-50 p-2 text-sm font-semibold text-amber-900">
                  {farm.verification_rejection_reason || farm.seller_verification_reason}
                </p>
              ) : null}

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <VerificationFlag done={Boolean(farm.email_verified)} label="Email Verification" />
                <VerificationFlag done={Boolean(farm.phone_verified)} label="Phone Verification" icon="phone" />
                <Info label="Seller Status" value={sellerStatusLabel(status)} />
                <Info label="Account Role" value={sellerAccountRoleLabel(farm.seller_account_role)} />
                <Info label="Seller Type" value={farm.seller_type === "business" ? "Business" : "Individual"} />
                <Info label="Document Status" value={String(farm.document_status ?? "not_submitted").replaceAll("_", " ")} />
                <Info label="Facial Status" value={String(farm.facial_verification_status ?? "not_started").replaceAll("_", " ")} />
                <Info label="Representative" value={String(farm.representative_verification_status ?? "not_required").replaceAll("_", " ")} />
                <Info label="Admin Override" value={farm.admin_verification_override ? "Yes" : "No"} />
                <Info label="Updated" value={farm.verification_updated_at ? new Date(farm.verification_updated_at).toLocaleString("en-ZA") : "Not updated"} />
              </div>

              {farm.seller_verification_documents?.length ? (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-bold">Uploaded documents</p>
                  <div className="mt-2 grid gap-2">
                    {farm.seller_verification_documents.map((document: any) => (
                      <div key={document.id} className="rounded-md bg-white p-2">
                        <span className="font-semibold">{String(document.document_type).replaceAll("_", " ")}</span>
                        <span className="text-slate-500"> · {document.file_name ?? "Uploaded file"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Info label="Representative Name" value={farm.representative_name || "Not set"} />
                <Info label="Representative Role" value={farm.representative_role || "Not set"} />
                <Info label="Representative Email" value={farm.representative_email || "Not set"} />
                <Info label="Business Email" value={farm.verification_email_status ?? (farm.verification_email_sent_at ? "queued" : "not_sent")} />
                <Info label="Facial Email" value={farm.facial_email_status ?? (farm.facial_email_sent_at ? "queued" : "not_sent")} />
              </div>

              <form action={updateSellerVerification} className="mt-4 grid gap-2">
                <input type="hidden" name="farmId" value={farm.id} />
                <label className="grid gap-1 text-sm font-bold">
                  Seller status
                  <select className="field" name="status" defaultValue={status === "not_started" ? "pending_review" : status}>
                    {statusOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Account role
                  <select className="field" name="sellerAccountRole" defaultValue={farm.seller_account_role ?? "farmer_seller"}>
                    {sellerRoleOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Reason or admin note
                  <input className="field" name="reason" placeholder="Reason, if rejected or suspended" defaultValue={farm.verification_rejection_reason ?? farm.seller_verification_reason ?? ""} />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="primary-button" type="submit" name="action" value="save">Save verification</button>
                  <button className="secondary-button" type="submit" name="action" value="approve_documents">Approve documents</button>
                  <button className="secondary-button" type="submit" name="action" value="request_more_information">Request more info</button>
                  <button className="secondary-button" type="submit" name="action" value="generate_didit">Generate Didit link</button>
                  <button className="secondary-button" type="submit" name="action" value="request_representative_verification">Request representative Didit</button>
                  <button className="secondary-button" type="submit" name="action" value="reset_facial">Reset facial</button>
                  <button className="secondary-button" type="submit" name="action" value="manual_verify">Manual verify</button>
                  <button className="secondary-button" type="submit" name="action" value="reset_override">Reset Override</button>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function VerificationFlag({ done, label, icon }: { done: boolean; label: string; icon?: "phone" }) {
  const Icon = icon === "phone" ? Phone : ShieldCheck;

  return (
    <div className={`flex items-center gap-2 rounded-md p-2 font-semibold ${done ? "bg-green-50 text-green-900" : "bg-slate-50 text-slate-600"}`}>
      {done ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
      <Icon size={16} />
      {label}: {done ? "Verified" : "Not verified"}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-1 font-bold text-brand-navy"><CircleAlert size={14} className="text-slate-400" /> {value}</p>
    </div>
  );
}
