import Link from "next/link";
import { AppShell, PageHeader } from "@/components/AppShell";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { LocationFields } from "@/components/LocationFields";
import { StableFormToken } from "@/components/StableFormToken";
import { UniversalListingForm } from "@/components/UniversalListingForm";
import { createUniversalMarketplaceListing } from "@/app/marketplace/actions";
import { getCurrentFarm } from "@/lib/farm-server";
import { createClient } from "@/lib/supabase/server";

export default async function CreateMarketplaceListingPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const farm = await getCurrentFarm();
  const supabase = await createClient();
  const { data: farmDetails } = await supabase
    .from("farms")
    .select("location, province, gps_latitude, gps_longitude")
    .eq("id", farm.id)
    .maybeSingle();

  return (
    <AppShell>
      <PageHeader
        title="Create listing"
        description="Choose a category and add the important details buyers need."
        action={<Link href="/marketplace" className="secondary-button">Back to marketplace</Link>}
      />
      {message ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {message}
        </div>
      ) : null}
      <section className="panel p-5">
        <form action={createUniversalMarketplaceListing} className="grid gap-3 sm:grid-cols-2">
          <StableFormToken />
          <UniversalListingForm />
          <label>
            <span className="text-sm font-semibold">Price</span>
            <input className="field mt-1" name="price" placeholder="e.g. R12 500" required />
          </label>
          <label>
            <span className="text-sm font-semibold">Price option</span>
            <select className="field mt-1" name="priceNegotiable" defaultValue="true">
              <option value="true">Negotiable - buyers can make offers</option>
              <option value="false">Not negotiable - buyers contact seller</option>
            </select>
          </label>
          <LocationFields
            defaultProvince={farmDetails?.province}
            defaultTown={farmDetails?.location}
            defaultLatitude={farmDetails?.gps_latitude}
            defaultLongitude={farmDetails?.gps_longitude}
          />
          <div className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4">
            <h3 className="font-bold">Seller contact</h3>
            <p className="mt-1 text-sm text-slate-600">Contact details are pulled from your registered profile and only shown after a buyer taps Contact Seller.</p>
          </div>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Preferred contact method</span>
            <select className="field mt-1" name="preferredContactMethod" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <textarea className="field mt-1 min-h-28" name="description" placeholder="Add condition, collection, delivery, packaging or seller terms." />
          </label>
          <FormSubmitButton label="Submit listing" pendingLabel="Saving listing..." className="primary-button sm:w-fit" />
        </form>
      </section>
    </AppShell>
  );
}
