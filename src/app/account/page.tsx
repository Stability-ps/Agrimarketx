import {
  Bell,
  Building2,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  FileText,
  FileSearch,
  Heart,
  Info,
  LogOut,
  Trash2,
  MessageCircle,
  Shield,
  Settings,
  Store
} from "lucide-react";
import { AccountMenuGroup, AccountMenuItem } from "@/components/AccountMenu";
import { AppShell, PageHeader } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOptionalCurrentFarm } from "@/lib/farm-server";

export default async function AccountPage() {
  const supabase = await createClient();
  const farm = await getOptionalCurrentFarm();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, whatsapp_number, avatar_url, account_role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const { data: farmRecord } = farm?.id
    ? await supabase
        .from("farms")
        .select("id, name, location, province, country, logo_url, photo_url, seller_verification_status")
        .eq("id", farm.id)
        .maybeSingle()
    : { data: null };
  const { data: verification } = await supabase
    .from("seller_verifications")
    .select("seller_verification_status, status, email_verified, phone_verified, seller_type")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const { count: farmCount } = await supabase
    .from("farm_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "");
  const accountRole = String(profile?.account_role ?? "buyer").replace("_", " ");
  const isSeller = ["seller", "admin", "super_admin"].includes(String(profile?.account_role ?? "buyer"));
  const sellerStatus = verification?.seller_verification_status ?? farmRecord?.seller_verification_status ?? "not_started";
  const checks = isSeller
    ? ([
        ["Profile photo added", Boolean(profile?.avatar_url)],
        ["Phone number added", Boolean(profile?.phone)],
        ["WhatsApp number added", Boolean(profile?.whatsapp_number)],
        ["At least one farm added", Boolean(farmCount && farmCount > 0)],
        ["Farm logo/photo added", Boolean(farmRecord?.logo_url || farmRecord?.photo_url)],
        ["Farm location added", Boolean(farmRecord?.location || farmRecord?.province || farmRecord?.country)],
        ["Seller verification started", sellerStatus !== "not_started"]
      ] as const)
    : ([
        ["Profile photo added", Boolean(profile?.avatar_url)],
        ["Phone number added", Boolean(profile?.phone)],
        ["WhatsApp number added", Boolean(profile?.whatsapp_number)],
        ["Email address added", Boolean(profile?.email || user?.email)],
        ["Marketplace account ready", true]
      ] as const);
  const completed = checks.filter(([, done]) => done);
  const percentage = Math.round((completed.length / checks.length) * 100);
  const verified = sellerStatus === "verified" || sellerStatus === "approved";

  return (
    <AppShell>
      <PageHeader
        title="Account"
        description="Manage your farms, marketplace activity, messages and app preferences."
      />

      <div className="mx-auto grid max-w-2xl gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">Profile completion</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize text-slate-700">
                  {accountRole}
                </span>
                {verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-800">
                    <CheckCircle2 size={14} />
                    Verified Seller
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{isSeller ? "Complete your seller profile to build trust with buyers." : "Complete your buyer profile for saved listings, messages and support."}</p>
            </div>
            <span className="text-2xl font-bold text-brand-green">{percentage}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-green" style={{ width: `${percentage}%` }} />
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {checks.map(([label, done]) => (
              <div key={label} className={done ? "font-semibold text-green-800" : "text-slate-500"}>
                {done ? "Done" : "Missing"}: {label}
              </div>
            ))}
          </div>
          <a href="/settings" className="primary-button mt-4 inline-flex">Complete Profile</a>
        </section>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Profile & security</h2>
          <AccountMenuGroup>
            <AccountMenuItem href="/settings" icon={Settings} title="Profile settings" description="Edit your photo, name, phone, WhatsApp and farm details." />
            <AccountMenuItem href="/account/preferences" icon={Shield} title="Security and preferences" description="Notification, privacy and account preferences." />
            <AccountMenuItem href="/account-deletion" icon={Trash2} title="Delete account" description="Request deletion of your AgriMarketX account and associated personal data." />
            <AccountMenuItem href="/account/type" icon={Store} title="Change account type" description="Switch between buyer-only, individual seller and business seller modes." />
          </AccountMenuGroup>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Seller & farm tools</h2>
        <AccountMenuGroup>
          <AccountMenuItem href={isSeller || farm ? "/settings#my-farms" : "/account/type"} icon={Building2} title="My Farms" description={isSeller || farm ? "Switch farms, add a farm and edit farm details." : "Start selling by creating your first farm profile."} />
          <AccountMenuItem href={isSeller || farm ? "/account/listings" : "/account/type"} icon={Store} title="My Listings" description={isSeller || farm ? "View and manage listings you are selling." : "Choose Manage my farm / Sell before creating listings."} />
          <AccountMenuItem href={isSeller || farm ? "/seller/verification" : "/account/type"} icon={CheckCircle2} title="Seller Verification" description={isSeller || farm ? "Verify your identity with Didit and track seller trust status." : "Available after you create a seller farm profile."} />
          <AccountMenuItem href="/subscription" icon={CreditCard} title="Subscription" description="View plan limits and subscription settings." />
        </AccountMenuGroup>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Marketplace activity</h2>
        <AccountMenuGroup>
          <AccountMenuItem href="/account/saved" icon={Heart} title="Saved Listings" description="Listings and farms you saved." />
          <AccountMenuItem href="/account/requests" icon={FileSearch} title="My Requests" description="Buyer requests and seller responses." />
          <AccountMenuItem href="/account/messages" icon={MessageCircle} title="Messages" description="Buyer and seller conversations." />
          <AccountMenuItem href="/account/notifications" icon={Bell} title="Notifications" description="Alerts for listings, approvals and messages." />
        </AccountMenuGroup>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Help & platform info</h2>
        <AccountMenuGroup>
          <AccountMenuItem href="/account/support" icon={CircleHelp} title="Support" description="Help centre, safety advice and problem reports." />
          <AccountMenuItem href="/account/legal" icon={FileText} title="Legal" description="Terms, privacy and marketplace rules." />
          <AccountMenuItem href="/account/about" icon={Info} title="About AgriMarketX" description="Company info, posting rules, blog and business tools." />
        </AccountMenuGroup>
        </div>

        <form action="/auth/signout" method="post" className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <button className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-red-50" type="submit">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-700">
              <LogOut size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-red-800">Logout</span>
              <span className="mt-0.5 block text-sm text-red-700">Sign out of this device.</span>
            </span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}
