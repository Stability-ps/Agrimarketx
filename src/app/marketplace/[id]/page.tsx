import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, Flag, Heart, Mail, MapPin, MessageCircle, Pencil, Phone, Send, ShieldCheck, Tag } from "lucide-react";
import { ListingImageGallery } from "@/components/ListingImageGallery";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { MarketplaceShareButton } from "@/components/MarketplaceShareButton";
import { recordListingContactClick } from "@/app/account/actions";
import { startMarketplaceConversation } from "@/app/account/messages/actions";
import { reportMarketplaceListing, sendGuestMarketplaceMessage, toggleSavedListing } from "@/app/marketplace/actions";
import { formatRand } from "@/lib/format";
import { getListingContact } from "@/lib/listing-contact";
import { recordListingMetric } from "@/lib/listing-metrics";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { publicStorageUrl } from "@/lib/files";
import { marketplaceCategoryLabel, marketplaceSubcategoryLabel } from "@/lib/marketplace-categories";
import { sellerAccountRoleLabel, sellerStatusLabel, sellerVerificationBadge, verificationTrustScore } from "@/lib/seller-badges";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agrimarketx.co.za";

const DETAIL_LABELS: Record<string, string> = {
  animal_type: "Animal type",
  animalType: "Animal type",
  bag_size: "Bag size",
  bagSize: "Bag size",
  breed: "Breed",
  condition: "Condition",
  delivery: "Delivery",
  grade: "Grade",
  harvest: "Harvest",
  horsepower: "Horsepower",
  hours_used: "Hours used",
  hoursUsed: "Hours used",
  kilometres: "Kilometres",
  mileage: "Mileage",
  model: "Model",
  protein: "Protein",
  quantity: "Quantity",
  service_unit: "Service unit",
  serviceUnit: "Service unit",
  stock_status: "Stock status",
  stockStatus: "Stock status",
  transmission: "Transmission",
  unit: "Unit",
  weight: "Weight",
  year: "Year"
};

const HIDDEN_DETAIL_KEYS = new Set([
  "address",
  "animal_id",
  "animalId",
  "category",
  "city",
  "created_at",
  "email",
  "exact_address",
  "farm_id",
  "farmId",
  "id",
  "latitude",
  "lat",
  "listing_id",
  "listingId",
  "longitude",
  "lng",
  "phone",
  "price",
  "private_address",
  "province",
  "seller_contact_email",
  "seller_contact_name",
  "seller_contact_phone",
  "seller_contact_whatsapp",
  "subcategory",
  "title",
  "town",
  "whatsapp"
]);

function listingPhotos(listing: any) {
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
  const animalPhotos = Array.isArray(animal?.animal_media)
    ? animal.animal_media
        .filter((item: any) => item.media_type === "photo")
        .sort((a: any, b: any) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
    : [];

  return [
    ...listingMedia.filter((item: any) => item.media_type === "photo").map((item: any) => ({ ...item, bucket: "farm-assets" })),
    ...animalPhotos.map((item: any) => ({ ...item, bucket: "animal-media" }))
  ];
}

function detailsForDisplay(details: Record<string, unknown> | null | undefined) {
  if (!details) {
    return [];
  }

  return Object.entries(details)
    .filter(([key, value]) => !HIDDEN_DETAIL_KEYS.has(key) && String(value ?? "").trim().length > 0)
    .map(([key, value]) => [
      DETAIL_LABELS[key] ??
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^\w/, (letter) => letter.toUpperCase()),
      String(value)
    ]);
}

function photoUrl(photo: any) {
  return photo?.storage_path ? publicStorageUrl(photo.bucket, photo.storage_path) : null;
}

function cleanDescription(text: string | null | undefined) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("id, title, description, price, province, town, approximate_location, category, marketplace_listing_media(storage_path, media_type, is_primary)")
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return {
      title: "Listing not found | AgriMarketX",
      description: "This AgriMarketX listing is no longer available."
    };
  }

  const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "South Africa";
  const description =
    cleanDescription(listing.description).slice(0, 150) ||
    `View ${listing.title} on AgriMarketX, South Africa's agricultural marketplace.`;
  const media = Array.isArray(listing.marketplace_listing_media)
    ? listing.marketplace_listing_media.find((item: any) => item.media_type === "photo" && item.is_primary) ?? listing.marketplace_listing_media.find((item: any) => item.media_type === "photo")
    : null;
  const image = media?.storage_path ? publicStorageUrl("farm-assets", media.storage_path) : `${SITE_URL}/icons/icon-512x512.png`;

  return {
    title: `${listing.title} in ${location} | AgriMarketX`,
    description,
    alternates: { canonical: `${SITE_URL}/marketplace/${listing.id}` },
    openGraph: {
      title: `${listing.title} | AgriMarketX`,
      description,
      url: `${SITE_URL}/marketplace/${listing.id}`,
      images: [{ url: image }]
    }
  };
}

function SimilarAdCard({ listing, returnTo }: { listing: any; returnTo: string }) {
  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const listingMedia = Array.isArray(listing.marketplace_listing_media) ? listing.marketplace_listing_media : [];
  const animalPhotos = Array.isArray(animal?.animal_media)
    ? animal.animal_media
        .filter((item: any) => item.media_type === "photo")
        .sort((a: any, b: any) => Number(Boolean(b.is_profile)) - Number(Boolean(a.is_profile)) || String(b.created_at).localeCompare(String(a.created_at)))
    : [];
  const photo = listingMedia.find((item: any) => item.media_type === "photo" && item.is_primary) ?? listingMedia.find((item: any) => item.media_type === "photo") ?? animalPhotos[0];
  const bucket = listingMedia.includes(photo) ? "farm-assets" : "animal-media";
  const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "Location not set";

  return (
    <article className="group relative overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-brand-green">
      <Link href={`/marketplace/${listing.id}?source=similar&returnTo=${encodeURIComponent(returnTo)}` as never} className="absolute inset-0 z-0" aria-label={`Open ${listing.title}`} />
      {photo?.storage_path ? (
        <img src={publicStorageUrl(bucket, photo.storage_path)} alt={listing.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="grid h-36 place-items-center bg-green-50 text-sm font-bold text-brand-green">No photo</div>
      )}
      <div className="relative z-0 p-3">
        <p className="line-clamp-2 font-bold text-brand-navy group-hover:text-brand-green">{listing.title}</p>
        <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-600"><MapPin size={14} className="shrink-0" /><span className="truncate">{location}</span></p>
        <p className="mt-2 text-sm text-slate-600">{marketplaceCategoryLabel(listing.category)}</p>
        <p className="mt-2 font-bold text-brand-green">{formatRand(listing.price)}</p>
      </div>
    </article>
  );
}

export default async function MarketplaceListingDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contact?: string; message?: string; returnTo?: string; source?: string }>;
}) {
  const { id } = await params;
  const { contact, message, returnTo, source } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email, account_role, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select(`
      id,
      seller_farm_id,
      animal_id,
      title,
      description,
      price,
      currency,
      province,
      town,
      approximate_location,
      price_negotiable,
      category,
      subcategory,
      listing_details,
      preferred_contact_method,
      status,
      created_at,
      animals(animal_code, passport_id, tag_number, breed, gender, age_category, current_weight_kg, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
      marketplace_listing_media(storage_path, media_type, is_primary, created_at),
      farms:seller_farm_id(id, name, logo_url, photo_url, description, supply_categories, province, location, created_at, seller_verification_status, seller_account_role, seller_type, document_status, facial_verification_status, sponsored_partner, email_verified, phone_verified, seller_verified_at, verification_updated_at)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return (
      <MarketplacePageShell>
        <section className="panel p-6 text-center">
          <h1 className="text-xl font-bold">Listing not found</h1>
          <Link href="/marketplace" className="primary-button mt-4">Back to marketplace</Link>
        </section>
      </MarketplacePageShell>
    );
  }

  await recordListingMetric(listing.id, "view");

  if (source === "similar") {
    await recordListingMetric(listing.id, "similar");
  }

  if (contact) {
    await recordListingMetric(listing.id, "contact");
  }

  const { data: savedListing } = user
    ? await supabase
        .from("marketplace_saved_listings")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const { data: similarAds } = await supabase
    .from("marketplace_listings")
    .select(`
      id,
      title,
      price,
      currency,
      province,
      town,
      approximate_location,
      category,
      subcategory,
      created_at,
      listing_details,
      animals(breed, gender, species(name), animal_media(storage_path, media_type, is_profile, created_at)),
      marketplace_listing_media(storage_path, media_type, is_primary, created_at)
    `)
    .eq("status", "active")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(24);

  const animal = Array.isArray(listing.animals) ? listing.animals[0] : listing.animals;
  const species = Array.isArray(animal?.species) ? animal.species[0] : animal?.species;
  const farm = Array.isArray(listing.farms) ? listing.farms[0] : listing.farms;
  const photos = listingPhotos(listing);
  const galleryPhotos = photos
    .map((photo: any) => {
      const url = photoUrl(photo);
      return url ? { url, alt: listing.title } : null;
    })
    .filter(Boolean) as { url: string; alt: string }[];
  const location = listing.approximate_location || [listing.town, listing.province].filter(Boolean).join(", ") || "Location not set";
  const badge = sellerVerificationBadge(farm?.seller_verification_status, farm?.seller_account_role, farm?.seller_type, farm?.sponsored_partner);
  const emailVerified = Boolean(farm?.email_verified);
  const phoneVerified = Boolean(farm?.phone_verified);
  const trustScore = verificationTrustScore({
    emailVerified,
    phoneVerified,
    facialVerified: farm?.facial_verification_status === "verified",
    documentsApproved: farm?.document_status === "approved",
    sellerType: farm?.seller_type
  });
  const details = detailsForDisplay(listing.listing_details as Record<string, unknown>);
  const canSeeStatus = ["seller", "admin", "super_admin"].includes(profile?.account_role ?? "");
  const backHref = returnTo?.startsWith("/marketplace") ? returnTo : "/marketplace";
  const { data: farmMembership } = user && farm?.id
    ? await supabase
        .from("farm_members")
        .select("role")
        .eq("farm_id", farm.id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const isOwnerViewing = Boolean(farmMembership) || ["admin", "super_admin"].includes(profile?.account_role ?? "");
  // Contact details are fetched server-side only after an explicit Contact
  // Seller request, and are rate limited per client to stop scraping.
  const contactRevealAllowed = contact && !isOwnerViewing ? await checkRateLimit("contactReveal") : false;
  const sellerContact = contactRevealAllowed ? await getListingContact(listing.id) : null;
  const listingRef = String(listing.id).slice(0, 8).toUpperCase();
  const orderedSimilarAds = (similarAds ?? [])
    .sort((a: any, b: any) => {
      const aScore =
        Number(a.subcategory === listing.subcategory) * 8 +
        Number(a.town === listing.town) * 4 +
        Number(a.province === listing.province) * 2 +
        Number(a.category === listing.category);
      const bScore =
        Number(b.subcategory === listing.subcategory) * 8 +
        Number(b.town === listing.town) * 4 +
        Number(b.province === listing.province) * 2 +
        Number(b.category === listing.category);
      return bScore - aScore || String(b.created_at).localeCompare(String(a.created_at));
    })
    .slice(0, 8);

  return (
    <MarketplacePageShell>
      <a href={backHref} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand-green hover:underline">
        <ArrowLeft size={17} />
        Back to Marketplace
      </a>
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}
      <div className="grid gap-5 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
        <main className="grid gap-5">
          <ListingImageGallery photos={galleryPhotos} title={listing.title} />

          <section className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-brand-navy">{listing.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1"><MapPin size={16} /> {location}</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={15} /> Listed {new Date(listing.created_at).toLocaleDateString("en-ZA")}</span>
                  <span className="inline-flex items-center gap-1"><Tag size={15} /> Ref {listingRef}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-brand-green">{formatRand(listing.price)}</p>
                <p className="text-sm font-semibold text-slate-600">{listing.price_negotiable ? "Negotiable" : "Fixed price"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{marketplaceCategoryLabel(listing.category)}</span>
              {marketplaceSubcategoryLabel(listing.category, listing.subcategory) ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{marketplaceSubcategoryLabel(listing.category, listing.subcategory)}</span> : null}
              {badge ? <span className="group relative rounded-full bg-green-50 px-2 py-1 text-brand-green">{badge}<span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-soft group-hover:block">Verified seller information is saved by AgriMarketX. Mobile number and email checks are shown in the seller panel.</span></span> : null}
              {canSeeStatus ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Status: {String(listing.status).replace("_", " ")}</span> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={toggleSavedListing}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="saved" value={savedListing ? "true" : "false"} />
                <input type="hidden" name="redirectTo" value={`/marketplace/${listing.id}?message=${encodeURIComponent(savedListing ? "Removed from favourites." : "Saved to your favourites.")}&returnTo=${encodeURIComponent(backHref)}`} />
                <button className="secondary-button" type="submit"><Heart size={17} /> {savedListing ? "Saved" : "Save"}</button>
              </form>
              <MarketplaceShareButton title={listing.title} url={`/marketplace/${listing.id}`} listingId={listing.id} />
            </div>
            {listing.description ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{listing.description}</p> : null}
          </section>

          <section className="panel p-5">
            <h2 className="font-bold">Listing details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Detail label="Category" value={marketplaceCategoryLabel(listing.category)} />
              {marketplaceSubcategoryLabel(listing.category, listing.subcategory) ? <Detail label="Subcategory" value={marketplaceSubcategoryLabel(listing.category, listing.subcategory) ?? ""} /> : null}
              {listing.town ? <Detail label="Town" value={listing.town} /> : null}
              {listing.province ? <Detail label="Province" value={listing.province} /> : null}
              {listing.approximate_location ? <Detail label="Public location" value={listing.approximate_location} /> : null}
              {species?.name ? <Detail label="Animal type" value={species.name} /> : null}
              {animal?.breed ? <Detail label="Breed" value={animal.breed} /> : null}
              {animal?.gender ? <Detail label="Sex" value={animal.gender} /> : null}
              {animal?.age_category ? <Detail label="Age" value={animal.age_category} /> : null}
              {animal?.current_weight_kg ? <Detail label="Weight" value={`${animal.current_weight_kg} kg`} /> : null}
              {animal?.passport_id ? <Detail label="QR/passport" value={animal.passport_id} /> : null}
              {details.map(([label, value]) => <Detail key={label} label={label} value={value} />)}
            </div>
          </section>
        </main>

        <aside className="grid content-start gap-4 lg:sticky lg:top-24">
          <section className="panel p-5">
            <h2 className="font-bold">Seller</h2>
            <div className="mt-3 flex items-center gap-3">
              {farm?.logo_url ? <img src={farm.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="grid h-12 w-12 rounded-full bg-green-50 text-xs font-bold text-brand-green place-items-center">Farm</div>}
              <div>
                <p className="font-bold">{farm?.name ?? "Seller"}</p>
                <p className="text-sm text-slate-600">{farm?.province || farm?.location || "South Africa"}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {badge ? (
                <p className="inline-flex w-fit items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-brand-green"><ShieldCheck size={14} /> {badge}</p>
              ) : null}
              <p className="text-sm font-semibold text-slate-700">Verification checks {trustScore}/100</p>
            </div>
            {farm?.created_at ? <p className="mt-2 text-sm text-slate-500">Selling on AgriMarketX since {new Date(farm.created_at).getFullYear()}</p> : null}
            <div className="mt-4 rounded-md border border-slate-200 p-3">
              <p className="font-bold">Verified Information</p>
              <VerifiedInfoRow done={farm?.seller_verification_status === "verified"} icon={ShieldCheck} label={`Seller Status: ${sellerStatusLabel(farm?.seller_verification_status)}`} />
              <VerifiedInfoRow done={phoneVerified} icon={Phone} label="Mobile Number" />
              <VerifiedInfoRow done={emailVerified} icon={Mail} label="Email Address" />
              <p className="mt-2 text-sm font-semibold text-slate-600">Account Role: {sellerAccountRoleLabel(farm?.seller_account_role)}</p>
            </div>
            {farm?.id ? <Link href={`/farms/${farm.id}` as never} className="secondary-button mt-4 w-full">View seller profile</Link> : null}
            <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-bold text-brand-navy">Safe trading</p>
              <p className="mt-1">Inspect items before paying, confirm ownership documents where relevant, and keep conversations inside AgriMarketX where possible.</p>
            </div>
          </section>

          <section className="panel grid gap-2 p-5">
            {isOwnerViewing ? (
              <div className="grid gap-2">
                <p className="font-bold text-brand-navy">Your listing tools</p>
                <p className="text-sm text-slate-600">Manage this advert from your seller listings dashboard.</p>
                <Link href="/account/listings" className="primary-button w-full"><Pencil size={17} /> Manage / Edit Listing</Link>
                <Link href="/marketplace/create" className="secondary-button w-full"><ClipboardList size={17} /> Create Another Listing</Link>
              </div>
            ) : (
              <>
                {contact ? (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-900">
                    <p className="font-bold">Seller contact</p>
                    {!contactRevealAllowed ? <p>{RATE_LIMIT_MESSAGE}</p> : null}
                    {sellerContact?.seller_contact_name ? <p>{sellerContact.seller_contact_name}</p> : null}
                    {sellerContact?.seller_contact_phone ? <p>Phone: {sellerContact.seller_contact_phone}</p> : null}
                    {sellerContact?.seller_contact_whatsapp ? <p>WhatsApp: {sellerContact.seller_contact_whatsapp}</p> : null}
                    {sellerContact?.seller_contact_email ? <p>Email: {sellerContact.seller_contact_email}</p> : null}
                    {contactRevealAllowed && !sellerContact?.seller_contact_phone && !sellerContact?.seller_contact_whatsapp && !sellerContact?.seller_contact_email ? <p>Seller contact details are not available yet. Try chat instead.</p> : null}
                  </div>
                ) : (
                  <form action={recordListingContactClick}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="metric" value="contact" />
                    <input type="hidden" name="redirectTo" value={`/marketplace/${listing.id}?contact=1&returnTo=${encodeURIComponent(backHref)}`} />
                    <button className="primary-button w-full" type="submit">Contact Seller</button>
                  </form>
                )}
                <form action={startMarketplaceConversation}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="message" value="Hi, I am interested in this listing." />
                  {user ? <button className="secondary-button w-full" type="submit"><MessageCircle size={17} /> Chat to Seller</button> : null}
                </form>
                {!user ? (
                  <details id="guest-chat" className="rounded-md border border-slate-200 p-3">
                    <summary className="cursor-pointer font-bold text-brand-green"><MessageCircle className="mr-2 inline" size={17} /> Chat to Seller</summary>
                    <form action={sendGuestMarketplaceMessage} className="mt-3 grid gap-2">
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input className="field" name="buyerName" placeholder="Your name" required />
                      <input className="field" name="buyerPhone" placeholder="Phone or WhatsApp" />
                      <input className="field" name="buyerEmail" type="email" placeholder="Email address" />
                      <textarea className="field min-h-24" name="message" placeholder="Write your message to the seller" required />
                      <button className="primary-button w-full" type="submit"><Send size={17} /> Send message</button>
                    </form>
                  </details>
                ) : null}
              </>
            )}
            <details className="rounded-md border border-slate-200 p-3">
              <summary className="cursor-pointer font-bold text-red-700"><Flag className="mr-2 inline" size={17} /> Report Listing</summary>
              <form action={reportMarketplaceListing} className="mt-3 grid gap-2">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="redirectTo" value={`/marketplace/${listing.id}?message=${encodeURIComponent("Thanks. The listing report was sent for review.")}&returnTo=${encodeURIComponent(backHref)}`} />
                <select className="field" name="reason" defaultValue="Suspicious seller">
                  <option>Scam or fraud</option>
                  <option>Fake product</option>
                  <option>Wrong category</option>
                  <option>Sold already</option>
                  <option>Offensive content</option>
                  <option>Suspicious seller</option>
                  <option>Other</option>
                </select>
                <textarea className="field min-h-20" name="notes" placeholder="Add a short note, optional" />
                <button className="secondary-button w-full text-red-700" type="submit">Send report</button>
              </form>
            </details>
          </section>
        </aside>
      </div>
      {orderedSimilarAds.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-brand-navy">Similar Ads</h2>
            <Link href={`/marketplace?category=${encodeURIComponent(listing.category)}${listing.subcategory ? `&subcategory=${encodeURIComponent(listing.subcategory)}` : ""}` as never} className="text-sm font-bold text-brand-green">View more</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {orderedSimilarAds.map((item) => <SimilarAdCard key={item.id} listing={item} returnTo={backHref} />)}
          </div>
        </section>
      ) : null}
      <div className="fixed inset-x-3 z-50 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}>
        {isOwnerViewing ? (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/account/listings" className="primary-button justify-center"><Pencil size={17} /> Manage</Link>
            <Link href="/marketplace" className="secondary-button justify-center">Marketplace</Link>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <form action={recordListingContactClick}>
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="metric" value="contact" />
              <input type="hidden" name="redirectTo" value={`/marketplace/${listing.id}?contact=1&returnTo=${encodeURIComponent(backHref)}`} />
              <button className="primary-button h-full w-full justify-center" type="submit">Contact</button>
            </form>
            {user ? (
              <form action={startMarketplaceConversation}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="message" value="Hi, I am interested in this listing." />
                <button className="secondary-button h-full w-full justify-center" type="submit"><MessageCircle size={17} /> Chat</button>
              </form>
            ) : (
              <Link href="#guest-chat" className="secondary-button h-full justify-center"><MessageCircle size={17} /> Chat</Link>
            )}
            <form action={toggleSavedListing}>
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="saved" value={savedListing ? "true" : "false"} />
              <input type="hidden" name="redirectTo" value={`/marketplace/${listing.id}?message=${encodeURIComponent(savedListing ? "Removed from favourites." : "Saved to your favourites.")}&returnTo=${encodeURIComponent(backHref)}`} />
              <button className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 text-brand-green" type="submit" aria-label={savedListing ? "Remove saved listing" : "Save listing"}><Heart size={18} /></button>
            </form>
          </div>
        )}
      </div>
    </MarketplacePageShell>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-brand-navy">{value}</p>
    </div>
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
