import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, CheckCircle2, Flag, Mail, MapPin, Phone, ShieldCheck, Store } from "lucide-react";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { formatRand } from "@/lib/format";
import { publicStorageUrl } from "@/lib/files";
import { marketplaceCategoryLabel } from "@/lib/marketplace-categories";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { sellerAccountRoleLabel, sellerStatusLabel, sellerVerificationBadge, verificationTrustScore } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";
import { toggleFarmFollow } from "@/app/account/actions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agrimarketx.co.za";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: farm } = await supabase
    .from("farms")
    .select("id, name, description, location, province, photo_url, logo_url")
    .eq("id", id)
    .maybeSingle();

  if (!farm) {
    return {
      title: "Seller profile not found | AgriMarketX",
      description: "This AgriMarketX seller profile is not available."
    };
  }

  const location = farm.location || farm.province || "South Africa";
  const description = farm.description || `View ${farm.name}, active listings and verification signals on AgriMarketX.`;

  return {
    title: `${farm.name} in ${location} | AgriMarketX Seller Profile`,
    description,
    alternates: { canonical: `${SITE_URL}/farms/${farm.id}` },
    openGraph: {
      title: `${farm.name} | AgriMarketX`,
      description,
      url: `${SITE_URL}/farms/${farm.id}`,
      images: [{ url: farm.photo_url || farm.logo_url || `${SITE_URL}/icon-512.png` }]
    }
  };
}

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
    .select("id, name, logo_url, photo_url, description, location, province, country, owner_name, owner_phone, supply_categories, created_at, seller_verification_status, seller_account_role, seller_type, document_status, facial_verification_status, sponsored_partner, email_verified, phone_verified, seller_verified_at, verification_updated_at")
    .eq("id", id)
    .maybeSingle();
  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, currency, category, subcategory, approximate_location, town, province, marketplace_listing_media(storage_path, media_type, is_primary)")
    .eq("seller_farm_id", id)
    .eq("status", "active")
    .limit(24);
  const { data: follow } = user
    ? await supabase.from("farm_followers").select("id").eq("farm_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (!farm) {
    return (
      <MarketplacePageShell>
        <section className="panel p-6 text-center">
          <h1 className="text-xl font-bold">Seller profile not found</h1>
          <p className="mt-2 text-slate-600">This public profile is not available.</p>
          <Link href="/marketplace" className="primary-button mt-4">Back to marketplace</Link>
        </section>
      </MarketplacePageShell>
    );
  }

  const badge = sellerVerificationBadge(farm.seller_verification_status, farm.seller_account_role, farm.seller_type, farm.sponsored_partner);
  const emailVerified = Boolean(farm.email_verified);
  const phoneVerified = Boolean(farm.phone_verified);
  const trustScore = verificationTrustScore({
    emailVerified,
    phoneVerified,
    facialVerified: farm.facial_verification_status === "verified",
    documentsApproved: farm.document_status === "approved",
    sellerType: farm.seller_type
  });
  const location = farm.location || [farm.province, farm.country].filter(Boolean).join(", ") || "Location not set";
  const categories = (farm.supply_categories ?? []) as string[];
  const reportHref = `/contact?subject=${encodeURIComponent(`Report seller: ${farm.name}`)}`;

  return (
    <MarketplacePageShell>
      <Link href="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand-green hover:underline">
        <ArrowLeft size={17} />
        Back to Marketplace
      </Link>
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <section className="panel overflow-hidden">
        {farm.photo_url ? (
          <img src={farm.photo_url} alt={farm.name} className="h-52 w-full object-cover sm:h-64" />
        ) : (
          <div className="h-40 bg-gradient-to-br from-green-50 to-slate-100 sm:h-56" />
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            {farm.logo_url ? (
              <img src={farm.logo_url} alt={farm.name} className="-mt-12 h-24 w-24 rounded-xl border-4 border-white bg-white object-cover shadow-soft" />
            ) : (
              <div className="-mt-12 grid h-24 w-24 place-items-center rounded-xl border-4 border-white bg-green-50 text-sm font-bold text-brand-green shadow-soft">Seller</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-brand-navy">{farm.name}</h1>
                {badge ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-800"><ShieldCheck size={14} /> {badge}</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1"><MapPin size={15} /> {location}</span>
                {farm.created_at ? <span className="inline-flex items-center gap-1"><Calendar size={15} /> On AgriMarketX since {new Date(farm.created_at).getFullYear()}</span> : null}
                <span className="inline-flex items-center gap-1"><Store size={15} /> {(listings ?? []).length} active listings</span>
              </div>
              {categories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => (
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
                  <p className="text-sm font-bold text-brand-green">Verification checks {trustScore}/100</p>
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
                <p className="mt-2 text-xs text-slate-500">Seller details are only shown after you choose to reveal them.</p>
              </div>
            </details>
            <form action={toggleFarmFollow}>
              <input type="hidden" name="farmId" value={farm.id} />
              <input type="hidden" name="following" value={follow ? "true" : "false"} />
              <button className="secondary-button" type="submit">{follow ? "Unfollow Farm" : "Follow Farm"}</button>
            </form>
            <Link href={reportHref as never} className="secondary-button text-red-700"><Flag size={16} /> Report seller</Link>
          </div>
        </div>
      </section>
      <section className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Active Listings</h2>
            <p className="text-sm text-slate-600">Approved adverts currently available from this seller.</p>
          </div>
          <Link href={`/marketplace?farm=${farm.id}` as never} className="text-sm font-bold text-brand-green">View marketplace results</Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(listings ?? []).map((listing) => {
            const media = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media.find((item) => item.is_primary) ?? listing.marketplace_listing_media[0] : null;
            const listingLocation = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || location;
            return (
              <Link key={listing.id} href={`/marketplace/${listing.id}?returnTo=${encodeURIComponent(`/farms/${farm.id}`)}` as never} className="overflow-hidden rounded-md border border-slate-200 bg-white hover:border-brand-green">
                {media?.storage_path ? <img src={publicStorageUrl("farm-assets", media.storage_path)} alt={listing.title} className="h-32 w-full object-cover" /> : <div className="grid h-32 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>}
                <div className="p-3">
                  <p className="font-bold">{listing.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{listingLocation}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{marketplaceCategoryLabel(listing.category)}</p>
                  <p className="mt-2 font-bold text-brand-green">{formatRand(listing.price)}</p>
                </div>
              </Link>
            );
          })}
          {(listings ?? []).length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">No active public listings yet.</div>
          ) : null}
        </div>
      </section>
    </MarketplacePageShell>
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
