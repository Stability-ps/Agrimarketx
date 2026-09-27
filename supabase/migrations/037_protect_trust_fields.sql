-- 037: stop sellers from setting their own trust/verification/moderation data.
--
-- Found during the production-hardening audit: the farms UPDATE policy lets
-- any owner/manager update EVERY column, so a seller could mark their own farm
-- "verified" (or sponsored, or un-suspend it) with one REST call. Listing
-- owners could likewise rewrite view/contact counters and moderation fields.
--
-- The triggers below only restrict normal API users (DB role anon or
-- authenticated) who are not platform admins. The service role, SECURITY
-- DEFINER functions (e.g. saved-count and metric updates) and migrations run
-- as other database roles and are unaffected. Compatible with both the old and
-- the new application code, so this can be applied at any time.

create or replace function public.api_user_is_unprivileged()
returns boolean
language plpgsql
stable
set search_path = public
as $$
begin
  if current_user = 'anon' then
    return true;
  end if;

  if current_user = 'authenticated' then
    return not public.is_platform_admin();
  end if;

  return false;
end;
$$;

revoke all on function public.api_user_is_unprivileged() from public, anon;
grant execute on function public.api_user_is_unprivileged() to authenticated;

-- ---------------------------------------------------------------------------
-- farms
-- ---------------------------------------------------------------------------
create or replace function public.protect_farm_trust_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.api_user_is_unprivileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New farms always start unverified, whatever the client sent.
    new.is_verified := false;
    new.seller_verification_status := 'not_started';
    new.seller_verification_reason := null;
    new.seller_verification_submitted_at := null;
    new.seller_verified_at := null;
    new.email_verified := false;
    new.email_verified_at := null;
    new.phone_verified := false;
    new.phone_verified_at := null;
    new.admin_verification_override := false;
    new.verification_updated_at := null;
    new.verification_rejection_reason := null;
    new.created_by_admin := false;
    new.suspended_at := null;
    new.rejected_at := null;
    new.document_status := 'not_submitted';
    new.facial_verification_status := 'not_started';
    new.representative_verification_status := 'not_required';
    new.representative_verification_required := false;
    new.representative_verified_at := null;
    new.didit_session_id := null;
    new.didit_verification_id := null;
    new.facial_didit_session_id := null;
    new.facial_didit_verification_id := null;
    new.verification_email_sent_at := null;
    new.facial_email_sent_at := null;
    new.verification_email_status := 'not_sent';
    new.facial_email_status := 'not_sent';
    new.sponsored_partner := false;

    if new.seller_account_role is null or new.seller_account_role not in ('individual_seller', 'business_seller', 'farmer_seller') then
      new.seller_account_role := 'farmer_seller';
    end if;

    if new.seller_type is null or new.seller_type not in ('individual', 'business') then
      new.seller_type := 'individual';
    end if;

    return new;
  end if;

  -- UPDATE by a seller: only "submit for review" style changes are allowed.
  if new.seller_verification_status is distinct from old.seller_verification_status then
    if new.seller_verification_status <> 'pending_review'
       or old.seller_verification_status = 'suspended'
       or old.suspended_at is not null then
      raise exception 'Seller verification status can only be changed by AgriMarketX.'
        using errcode = '42501';
    end if;
  end if;

  if new.seller_verification_reason is distinct from old.seller_verification_reason
     and new.seller_verification_reason is not null then
    raise exception 'Seller verification notes can only be changed by AgriMarketX.' using errcode = '42501';
  end if;

  if new.seller_account_role is distinct from old.seller_account_role
     and new.seller_account_role not in ('individual_seller', 'business_seller') then
    raise exception 'This seller role can only be assigned by AgriMarketX.' using errcode = '42501';
  end if;

  if new.seller_type is distinct from old.seller_type
     and new.seller_type not in ('individual', 'business') then
    raise exception 'Invalid seller type.' using errcode = '42501';
  end if;

  if (new.is_verified, new.seller_verified_at, new.email_verified, new.email_verified_at,
      new.phone_verified, new.phone_verified_at, new.admin_verification_override,
      new.verification_updated_at, new.verification_rejection_reason, new.created_by_admin,
      new.suspended_at, new.rejected_at, new.document_status, new.facial_verification_status,
      new.representative_verification_status, new.representative_verification_required,
      new.representative_verified_at, new.didit_session_id, new.didit_verification_id,
      new.facial_didit_session_id, new.facial_didit_verification_id,
      new.verification_email_sent_at, new.facial_email_sent_at,
      new.verification_email_status, new.facial_email_status, new.sponsored_partner)
     is distinct from
     (old.is_verified, old.seller_verified_at, old.email_verified, old.email_verified_at,
      old.phone_verified, old.phone_verified_at, old.admin_verification_override,
      old.verification_updated_at, old.verification_rejection_reason, old.created_by_admin,
      old.suspended_at, old.rejected_at, old.document_status, old.facial_verification_status,
      old.representative_verification_status, old.representative_verification_required,
      old.representative_verified_at, old.didit_session_id, old.didit_verification_id,
      old.facial_didit_session_id, old.facial_didit_verification_id,
      old.verification_email_sent_at, old.facial_email_sent_at,
      old.verification_email_status, old.facial_email_status, old.sponsored_partner) then
    raise exception 'Verification fields can only be changed by AgriMarketX.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_farm_trust_fields on public.farms;
create trigger protect_farm_trust_fields
before insert or update on public.farms
for each row execute function public.protect_farm_trust_fields();

-- ---------------------------------------------------------------------------
-- marketplace_listings: counters and moderation data are server/admin only.
-- (Publishing is already guarded: the owner policy forbids status 'active'.)
-- ---------------------------------------------------------------------------
create or replace function public.protect_listing_trust_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.api_user_is_unprivileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.views_count := 0;
    new.contact_clicks_count := 0;
    new.whatsapp_clicks_count := 0;
    new.call_clicks_count := 0;
    new.chat_clicks_count := 0;
    new.share_clicks_count := 0;
    new.similar_clicks_count := 0;
    new.saved_count := 0;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.rejection_reason := null;
    return new;
  end if;

  if (new.views_count, new.contact_clicks_count, new.whatsapp_clicks_count, new.call_clicks_count,
      new.chat_clicks_count, new.share_clicks_count, new.similar_clicks_count, new.saved_count,
      new.reviewed_at, new.reviewed_by, new.rejection_reason)
     is distinct from
     (old.views_count, old.contact_clicks_count, old.whatsapp_clicks_count, old.call_clicks_count,
      old.chat_clicks_count, old.share_clicks_count, old.similar_clicks_count, old.saved_count,
      old.reviewed_at, old.reviewed_by, old.rejection_reason) then
    raise exception 'Listing statistics and moderation fields can only be changed by AgriMarketX.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_listing_trust_fields on public.marketplace_listings;
create trigger protect_listing_trust_fields
before insert or update on public.marketplace_listings
for each row execute function public.protect_listing_trust_fields();
