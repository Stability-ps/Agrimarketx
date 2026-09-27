import { createAdminClient } from "@/lib/supabase/admin";

export type ListingContact = {
  seller_contact_name: string | null;
  seller_contact_phone: string | null;
  seller_contact_whatsapp: string | null;
  seller_contact_email: string | null;
};

/**
 * Seller contact details are not readable by public clients (column
 * privileges, migration 036). The server reveals them only for an explicit
 * Contact Seller request on an active listing, or to the listing's own farm
 * members. Callers must apply their own rate limit first.
 */
export async function getListingContact(listingId: string, options: { viewerIsSeller?: boolean } = {}) {
  const admin = createAdminClient();
  let query = admin
    .from("marketplace_listings")
    .select("seller_contact_name, seller_contact_phone, seller_contact_whatsapp, seller_contact_email")
    .eq("id", listingId);

  if (!options.viewerIsSeller) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(`[listing-contact] ${error.message}`);
    return null;
  }

  return (data as ListingContact | null) ?? null;
}
