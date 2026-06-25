import Link from "next/link";
import { CalendarDays, FileSearch, MapPin, Package, PawPrint } from "lucide-react";
import { LocationFields } from "@/components/LocationFields";
import { MarketplacePageShell } from "@/components/MarketplaceShell";
import { WantedRequestCategoryFields } from "@/components/WantedRequestCategoryFields";
import { publicStorageUrl } from "@/lib/files";
import { marketplaceSubcategoryLabel } from "@/lib/marketplace-categories";
import { supplyCategoryLabel } from "@/lib/supply-categories";
import { createClient } from "@/lib/supabase/server";
import { createBuyerRequest, respondToBuyerRequest } from "./actions";

function urgencyLabel(value: string | null | undefined) {
  if (value === "urgent") return "Urgent";
  if (value === "needed_soon") return "Needed Soon";
  return "Flexible";
}

function requestPhoto(request: any) {
  const media = Array.isArray(request.buyer_request_media) ? request.buyer_request_media : [];
  return media.find((item: any) => item.is_primary) ?? media[0];
}

export default async function WantedListingsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; request?: string }>;
}) {
  const { message, request } = await searchParams;
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
  const isSeller = ["seller", "admin", "super_admin"].includes(profile?.account_role ?? "buyer");
  const { data: sellerFarms } = isSeller && user
    ? await supabase
        .from("farm_members")
        .select("farm_id, farms(id, name, supply_categories)")
        .eq("user_id", user.id)
        .limit(20)
    : { data: [] };
  const { data: requests } = await supabase
    .from("buyer_requests")
    .select("id, title, category, subcategory, description, province, town, approximate_location, quantity, budget, urgency, needed_by, contact_preference, status, created_at, buyer_request_media(storage_path, media_type, is_primary, created_at)")
    .in("status", ["approved", "published", "matched"])
    .order("created_at", { ascending: false })
    .limit(40);
  const selected = requests?.find((item) => item.id === request);

  return (
    <MarketplacePageShell>
      <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Wanted Listings</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Buyer requests for livestock, feed, produce, equipment and services. Contact details stay private.</p>
        </div>
        <Link href="/marketplace" className="secondary-button">Back to marketplace</Link>
      </section>

      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">{message}</div> : null}

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-brand-green"><FileSearch size={20} /></span>
          <div>
            <h2 className="font-bold">Tell us what you need</h2>
            <p className="text-sm text-slate-600">Submit a request. Admin reviews it before sellers can respond.</p>
          </div>
        </div>
        {user ? (
          <form action={createBuyerRequest} className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="field" name="title" placeholder="e.g. Looking for 20 Boer does" required />
            <WantedRequestCategoryFields />
            <input className="field" name="quantity" placeholder="Quantity, e.g. 20 does" />
            <input className="field" name="budget" placeholder="Budget range, e.g. R2 500 - R3 000" />
            <select className="field" name="urgency" defaultValue="needed_soon">
              <option value="urgent">Urgent</option>
              <option value="needed_soon">Needed Soon</option>
              <option value="flexible">Flexible</option>
            </select>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Needed by
              <input className="field" type="date" name="neededBy" />
            </label>
            <div className="md:col-span-2">
              <LocationFields />
            </div>
            <select className="field" name="contactPreference" defaultValue="message">
              <option value="message">Message first</option>
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Optional photos
              <input className="field" type="file" name="requestPhotos" accept="image/*" multiple />
              <span className="text-xs font-normal text-slate-500">Upload up to 4 helpful reference photos.</span>
            </label>
            <textarea className="field min-h-24 md:col-span-2" name="description" placeholder="Add useful details sellers need to quote." />
            <button className="primary-button md:w-fit" type="submit">Submit request</button>
          </form>
        ) : (
          <Link href="/login?next=%2Fmarketplace%2Fwanted" className="primary-button mt-4 inline-flex">Login to create request</Link>
        )}
      </section>

      {selected && isSeller ? (
        <section className="mb-5 rounded-md border border-green-200 bg-green-50 p-4">
          <h2 className="font-bold text-brand-green">Respond to: {selected.title}</h2>
          <form action={respondToBuyerRequest} className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="requestId" value={selected.id} />
            <select className="field" name="farmId" required>
              <option value="">Choose seller farm</option>
              {(sellerFarms ?? []).map((membership) => {
                const farm = Array.isArray(membership.farms) ? membership.farms[0] : membership.farms;
                return farm ? <option key={farm.id} value={farm.id}>{farm.name}</option> : null;
              })}
            </select>
            <input className="field" name="quoteAmount" placeholder="Quote amount, optional" />
            <input className="field" name="availableQuantity" placeholder="Available quantity" />
            <input className="field" name="deliveryOption" placeholder="Delivery / collection option" />
            <select className="field" name="contactPreference" defaultValue="message">
              <option value="message">Message first</option>
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <textarea className="field min-h-24 md:col-span-2" name="message" placeholder="Tell the buyer what you can supply." required />
            <button className="primary-button md:w-fit" type="submit">Send response</button>
          </form>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(requests ?? []).length === 0 ? (
          <section className="panel p-5">
            <h2 className="font-bold">No approved requests yet</h2>
            <p className="mt-1 text-sm text-slate-600">Buyer requests will appear here after review.</p>
          </section>
        ) : null}
        {(requests ?? []).map((wanted) => (
          <article key={wanted.id} className="rounded-md border border-slate-200 bg-white p-4">
            {requestPhoto(wanted)?.storage_path ? (
              <img src={publicStorageUrl("farm-assets", requestPhoto(wanted).storage_path)} alt={wanted.title} className="mb-3 h-32 w-full rounded-md object-cover" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-green-50 text-brand-green">
                {wanted.category === "livestock" ? <PawPrint size={22} /> : <Package size={22} />}
              </span>
            )}
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {supplyCategoryLabel(wanted.category)}
              {marketplaceSubcategoryLabel(wanted.category, wanted.subcategory) ? ` · ${marketplaceSubcategoryLabel(wanted.category, wanted.subcategory)}` : ""}
            </p>
            <h2 className="mt-1 font-bold text-brand-navy">{wanted.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} /> {wanted.approximate_location || [wanted.town, wanted.province].filter(Boolean).join(", ") || "South Africa"}</p>
            {wanted.quantity ? <p className="mt-2 text-sm text-slate-700">Quantity: {wanted.quantity}</p> : null}
            {wanted.budget ? <p className="mt-1 text-sm font-semibold text-slate-700">{wanted.budget}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-green-50 px-2 py-1 text-brand-green">{urgencyLabel(wanted.urgency)}</span>
              {wanted.needed_by ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700"><CalendarDays size={13} /> Needed by {new Date(wanted.needed_by).toLocaleDateString("en-ZA")}</span> : null}
            </div>
            {wanted.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{wanted.description}</p> : null}
            {isSeller ? (
              <Link href={`/marketplace/wanted?request=${wanted.id}` as never} className="secondary-button mt-4 w-full">Respond</Link>
            ) : (
              <Link href={`/marketplace?location=${encodeURIComponent(wanted.province ?? "")}` as never} className="secondary-button mt-4 w-full">Browse matching listings</Link>
            )}
          </article>
        ))}
      </div>
    </MarketplacePageShell>
  );
}
