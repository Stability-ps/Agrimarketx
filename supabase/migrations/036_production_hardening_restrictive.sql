-- 036: production hardening, RESTRICTIVE part.
--
-- Apply ONLY AFTER the application code from the same release is deployed.
-- The previous code reads columns/functions that this migration locks down.
-- Requires 035 (approx listing coordinates, private documents bucket).

-- ===========================================================================
-- 1. farms: public clients may only read explicitly public columns.
--    Row policies are unchanged; column privileges stop anon/authenticated
--    clients (including direct REST calls with the public key) from reading
--    phone numbers, GPS, identity/business data and verification metadata.
--    Server code that legitimately needs those fields uses the service role
--    after its own authorization checks.
-- ===========================================================================
revoke select on public.farms from anon, authenticated;
grant select (
  id, name, location, province, city, country, farm_type,
  logo_url, photo_url, business_logo_url, description, supply_categories,
  is_verified, seller_verification_status, seller_verified_at, verification_updated_at,
  email_verified, phone_verified, document_status, facial_verification_status,
  seller_account_role, seller_type, sponsored_partner,
  created_at, updated_at
) on public.farms to anon, authenticated;

-- ===========================================================================
-- 2. marketplace_listings: seller contact details and exact coordinates are
--    private. Contact details are revealed only by the server after an
--    explicit Contact Seller request; the public gets ~1 km coordinates.
-- ===========================================================================
revoke select on public.marketplace_listings from anon, authenticated;
grant select (
  id, seller_farm_id, animal_id, title, description, price, currency, price_negotiable,
  province, town, approximate_location, approx_latitude, approx_longitude,
  category, subcategory, listing_details, preferred_contact_method,
  status, created_at, expires_at, reviewed_at, reviewed_by, rejection_reason, client_request_id,
  views_count, contact_clicks_count, whatsapp_clicks_count, call_clicks_count,
  chat_clicks_count, share_clicks_count, similar_clicks_count, saved_count,
  reveal_gps_after_approval
) on public.marketplace_listings to anon, authenticated;
-- Not granted: seller_contact_name, seller_contact_phone, seller_contact_whatsapp,
-- seller_contact_email, latitude, longitude.

-- ===========================================================================
-- 3. animals: anonymous visitors only see listing-relevant animal fields.
--    (Farm members read all columns as `authenticated`, so that role keeps
--    full column access; row policies still restrict which animals.)
-- ===========================================================================
revoke select on public.animals from anon;
grant select (
  id, farm_id, species_id, animal_code, passport_id, tag_number, breed, gender,
  age_category, current_weight_kg, status, public_passport_enabled, created_at, updated_at
) on public.animals to anon;

-- ===========================================================================
-- 4. Notifications are created server-side only (service role). The old
--    policy let any client insert a notification for any user.
-- ===========================================================================
drop policy if exists "System creates notifications" on public.app_notifications;

-- Enquiries/contact messages are written server-side only, after validation
-- and rate limiting. The open INSERT policies allowed unlimited direct spam.
drop policy if exists "Anyone can create marketplace enquiries" on public.marketplace_enquiries;
drop policy if exists "Anyone can create public contact enquiries" on public.public_contact_enquiries;

-- ===========================================================================
-- 5. Storage: ownership-based write access, verification documents private.
-- ===========================================================================
-- New uploads to the public bucket must be images (verification documents now
-- go to the private seller-verification-documents bucket).
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'farm-assets';

drop policy if exists "Authenticated users read farm asset files" on storage.objects;
drop policy if exists "Authenticated users upload farm asset files" on storage.objects;
drop policy if exists "Authenticated users update farm asset files" on storage.objects;
drop policy if exists "Authenticated users read animal media files" on storage.objects;
drop policy if exists "Authenticated users upload animal media files" on storage.objects;
drop policy if exists "Authenticated users update animal media files" on storage.objects;

-- Who may write a farm-assets object, derived from its path prefix:
--   listings/<listing_id>/...      owner/manager of the listing's farm
--   farms/<farm_id>/...            owner/manager of that farm (logos)
--   profiles/<user_id>/...         that user (avatars)
--   buyer-requests/<request_id>/.. the buyer who owns the request
--   verification-documents/...     nobody (legacy path, server only)
create or replace function public.can_write_farm_asset(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select case split_part(object_name, '/', 1)
    when 'listings' then exists (
      select 1 from public.marketplace_listings ml
      where ml.id::text = split_part(object_name, '/', 2)
        and public.has_farm_role(ml.seller_farm_id, array['owner'::app_role, 'manager'::app_role])
    )
    when 'farms' then exists (
      select 1 from public.farms f
      where f.id::text = split_part(object_name, '/', 2)
        and public.has_farm_role(f.id, array['owner'::app_role, 'manager'::app_role])
    )
    when 'profiles' then split_part(object_name, '/', 2) = auth.uid()::text
    when 'buyer-requests' then exists (
      select 1 from public.buyer_requests br
      where br.id::text = split_part(object_name, '/', 2)
        and br.buyer_id = auth.uid()
    )
    else false
  end;
$$;

revoke all on function public.can_write_farm_asset(text) from public, anon;
grant execute on function public.can_write_farm_asset(text) to authenticated;

create policy "Owners upload farm asset files"
on storage.objects for insert to authenticated
with check (bucket_id = 'farm-assets' and public.can_write_farm_asset(name));

create policy "Owners update farm asset files"
on storage.objects for update to authenticated
using (bucket_id = 'farm-assets' and public.can_write_farm_asset(name))
with check (bucket_id = 'farm-assets' and public.can_write_farm_asset(name));

create policy "Owners delete farm asset files"
on storage.objects for delete to authenticated
using (bucket_id = 'farm-assets' and public.can_write_farm_asset(name));

-- animal-media paths are <farm_id>/<animal_id>/...
create policy "Farm staff upload animal media files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'animal-media'
  and public.has_farm_role(
    (case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then split_part(name, '/', 1)::uuid end),
    array['owner'::app_role, 'manager'::app_role, 'worker'::app_role, 'vet'::app_role]
  )
);

create policy "Farm staff update animal media files"
on storage.objects for update to authenticated
using (
  bucket_id = 'animal-media'
  and public.has_farm_role(
    (case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then split_part(name, '/', 1)::uuid end),
    array['owner'::app_role, 'manager'::app_role, 'worker'::app_role, 'vet'::app_role]
  )
);

create policy "Farm staff delete animal media files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'animal-media'
  and public.has_farm_role(
    (case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then split_part(name, '/', 1)::uuid end),
    array['owner'::app_role, 'manager'::app_role, 'worker'::app_role, 'vet'::app_role]
  )
);
-- Reads of public-bucket files go through public URLs; no API listing policy
-- is granted, so clients can no longer enumerate bucket contents.
-- seller-verification-documents has no policies at all: service role only.

-- ===========================================================================
-- 6. SECURITY DEFINER functions: least privilege.
-- ===========================================================================
-- Trigger-only functions: nobody needs to call them directly. Triggers keep
-- firing (EXECUTE is only checked when a trigger is created).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_account_role() from public, anon, authenticated;
revoke execute on function public.refresh_listing_saved_count() from public, anon, authenticated;
revoke execute on function public.sync_seller_verification_to_farms() from public, anon, authenticated;

-- Listing metrics are recorded server-side (validated + rate limited).
revoke execute on function public.increment_listing_metric(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_listing_metric(uuid, text) to service_role;

-- Ownership transfer RPCs are for signed-in users only.
revoke execute on function public.buyer_select_transfer_delivery(uuid, text, uuid) from public, anon;
grant execute on function public.buyer_select_transfer_delivery(uuid, text, uuid) to authenticated;
revoke execute on function public.complete_ownership_transfer(uuid, uuid) from public, anon;
grant execute on function public.complete_ownership_transfer(uuid, uuid) to authenticated;

-- RLS helper functions are only meaningful for signed-in users (they check
-- auth.uid()). Scope every policy that calls them to `authenticated`, keep
-- the anon-visible part of mixed policies as explicit anon policies, then
-- stop anon from executing the helpers.
create policy "Anon reads public passport animals"
on public.animals for select to anon
using (public_passport_enabled = true);

create policy "Anon reads approved request media"
on public.buyer_request_media for select to anon
using (exists (
  select 1 from public.buyer_requests br
  where br.id = buyer_request_media.request_id
    and br.status = any (array['approved'::text, 'published'::text, 'matched'::text])
));

create policy "Anon reads active marketplace categories"
on public.marketplace_categories for select to anon
using (active = true);

create policy "Anon reads active marketplace subcategories"
on public.marketplace_subcategories for select to anon
using (active = true);

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname in ('public', 'storage')
      and roles = '{public}'
      and (coalesce(qual, '') || coalesce(with_check, ''))
          ~ '(is_farm_member|has_farm_role|is_platform_admin|is_super_admin|is_company_owner|can_access_conversation)\('
  loop
    execute format('alter policy %I on %I.%I to authenticated', p.policyname, p.schemaname, p.tablename);
  end loop;
end;
$$;

revoke execute on function public.can_access_conversation(uuid) from public, anon;
revoke execute on function public.has_farm_role(uuid, app_role[]) from public, anon;
revoke execute on function public.is_company_owner(uuid) from public, anon;
revoke execute on function public.is_farm_member(uuid) from public, anon;
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.has_farm_role(uuid, app_role[]) to authenticated;
grant execute on function public.is_company_owner(uuid) to authenticated;
grant execute on function public.is_farm_member(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
