import Link from "next/link";
import { CheckCircle2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { sellerAccountRoleLabel, sellerStatusLabel, sellerTrustScore, sellerVerificationBadge } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";
import { toggleFarmFollow } from "@/app/account/actions";

export default async function PublicFarmProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; contact?: string }>;
}) {
  const { id } = await params;
  const { message, contact } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: farm } = await supabase
    .from("farms")
    .select("id, name, logo_url, photo_url, description, location, province, country, owner_name, owner_phone, supply_categories, seller_verification_status, seller_account_role, email_verified, phone_verified, seller_verified_at, verification_updated_at")
    .eq("id", id)
    .maybeSingle();
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, currency, approximate_location, marketplace_listing_media(storage_path, media_type, is_primary)")
    .eq("seller_farm_id", id)
    .eq("status", "active")
    .limit(24);
  const { data: follow } = user
    ? await supabase.from("farm_followers").select("id").eq("farm_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (!farm) {
    return (
      <AppShell>
        <PageHeader title="Farm not found" description="This farm profile is not available." />
      </AppShell>
    );
  }

  const badge = sellerVerificationBadge(farm.seller_verification_status, farm.seller_account_role);
  const emailVerified = Boolean(farm.email_verified);
  const phoneVerified = Boolean(farm.phone_verified);
  const trustScore = sellerTrustScore(emailVerified, phoneVerified);
  const location = farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "Location not set";

  return (
    <AppShell>
      <PageHeader title={farm.name} description="Public farm profile and active marketplace listings." />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <section className="panel overflow-hidden">
        {farm.photo_url ? <img src={farm.photo_url} alt={farm.name} className="h-44 w-full object-cover" /> : null}
        <div className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            {farm.logo_url ? (
              <img src={farm.logo_url} alt={farm.name} className="h-20 w-20 rounded-md object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-md bg-green-50 text-sm font-bold text-brand-green">Farm</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{farm.name}</h2>
                {badge ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-800"><ShieldCheck size={14} /> {badge}</span> : null}
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600"><MapPin size={15} /> {location}</p>
              {(farm.supply_categories ?? []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {((farm.supply_categories ?? []) as string[]).map((category) => (
                    <span key={category} className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-brand-green">
                      {supplyCategoryLabel(category)}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-sm text-slate-700">{farm.description || "This farm has not added a public description yet."}</p>
              <div className="mt-4 rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">Verified Information</p>
                  <p className="text-sm font-bold text-brand-green">{trustScore} Trust Score</p>
                </div>
                <VerifiedInfoRow done={farm.seller_verification_status === "verified"} icon={ShieldCheck} label={`Seller Status: ${sellerStatusLabel(farm.seller_verification_status)}`} />
                <VerifiedInfoRow done={phoneVerified} icon={Phone} label="Mobile Number" />
                <VerifiedInfoRow done={emailVerified} icon={Mail} label="Email Address" />
                <p className="mt-2 text-sm font-semibold text-slate-600">Account Role: {sellerAccountRoleLabel(farm.seller_account_role)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <details className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">
              <summary className="cursor-pointer">Contact Seller</summary>
              <div className="mt-3 min-w-56 text-sm font-normal text-slate-700">
                <p>{farm.owner_name ?? farm.name}</p>
                {contact === "show" && farm.owner_phone ? <p className="mt-1 font-semibold">Phone: {farm.owner_phone}</p> : <Link href={`/farms/${farm.id}?contact=show` as never} className="mt-1 inline-block text-brand-green">Show phone number</Link>}
              </div>
            </details>
            <form action={toggleFarmFollow}>
              <input type="hidden" name="farmId" value={farm.id} />
              <input type="hidden" name="following" value={follow ? "true" : "false"} />
              <button className="secondary-button" type="submit">{follow ? "Unfollow Farm" : "Follow Farm"}</button>
            </form>
          </div>
        </div>
      </section>
      <section className="mt-4">
        <h3 className="font-bold">Active listings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(listings ?? []).map((listing) => {
            const media = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media.find((item) => item.is_primary) ?? listing.marketplace_listing_media[0] : null;
            return (
              <Link key={listing.id} href={`/marketplace/${listing.id}?returnTo=${encodeURIComponent(`/farms/${farm.id}`)}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white hover:border-brand-green">
                {media?.storage_path ? <img src={publicStorageUrl("farm-assets", media.storage_path)} alt={listing.title} className="h-32 w-full object-cover" /> : <div className="grid h-32 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>}
                <div className="p-3">
                  <p className="font-bold">{listing.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{listing.approximate_location || location}</p>
                  <p className="mt-2 font-bold text-brand-green">{formatRand(listing.price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function VerifiedInfoRow({ done, icon: Icon, label }: { done: boolean; icon: typeof ShieldCheck; label: string }) {
  return (
    <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${done ? "text-green-800" : "text-slate-400"}`}>
      {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
      {label}
    </p>
  );
}
