alter table public.farms
drop constraint if exists farms_seller_verification_status_check;

alter table public.farms
add column if not exists email_verified boolean not null default false,
add column if not exists email_verified_at timestamptz,
add column if not exists phone_verified boolean not null default false,
add column if not exists phone_verified_at timestamptz,
add column if not exists admin_verification_override boolean not null default false,
add column if not exists verification_updated_at timestamptz,
add column if not exists verification_rejection_reason text,
add column if not exists seller_account_role text not null default 'farmer_seller',
add column if not exists created_by_admin boolean not null default false,
add column if not exists suspended_at timestamptz,
add column if not exists rejected_at timestamptz;

alter table public.farms
add constraint farms_seller_verification_status_check
check (seller_verification_status in ('not_started', 'pending_review', 'verified', 'rejected', 'suspended'));

alter table public.farms
drop constraint if exists farms_seller_account_role_check;

alter table public.farms
add constraint farms_seller_account_role_check
check (seller_account_role in (
  'farmer_seller',
  'shop_seller',
  'service_provider',
  'advertiser',
  'admin_created_seller',
  'super_admin'
));

alter table public.seller_verifications
add column if not exists seller_verification_status text not null default 'not_started',
add column if not exists admin_verification_override boolean not null default false,
add column if not exists verification_updated_at timestamptz,
add column if not exists verification_rejection_reason text,
add column if not exists account_role text not null default 'farmer_seller',
add column if not exists created_by_admin boolean not null default false,
add column if not exists suspended_at timestamptz,
add column if not exists rejected_at timestamptz;

alter table public.seller_verifications
drop constraint if exists seller_verifications_seller_verification_status_check;

alter table public.seller_verifications
add constraint seller_verifications_seller_verification_status_check
check (seller_verification_status in ('not_started', 'pending_review', 'verified', 'rejected', 'suspended'));

alter table public.seller_verifications
drop constraint if exists seller_verifications_account_role_check;

alter table public.seller_verifications
add constraint seller_verifications_account_role_check
check (account_role in (
  'farmer_seller',
  'shop_seller',
  'service_provider',
  'advertiser',
  'admin_created_seller',
  'super_admin'
));

alter table public.marketplace_listings
drop constraint if exists marketplace_listings_status_check;

alter table public.marketplace_listings
add constraint marketplace_listings_status_check
check (status in ('draft', 'under_review', 'active', 'reserved', 'sold', 'paused', 'removed', 'rejected', 'suspended'));

alter table public.marketplace_listings
add column if not exists client_request_id text;

create unique index if not exists marketplace_listings_client_request_id_unique
on public.marketplace_listings(client_request_id)
where client_request_id is not null;

create index if not exists farms_seller_verification_status_idx on public.farms(seller_verification_status);
create index if not exists farms_seller_account_role_idx on public.farms(seller_account_role);
create index if not exists farms_email_phone_verified_idx on public.farms(email_verified, phone_verified);
create index if not exists marketplace_listings_seller_status_idx on public.marketplace_listings(seller_farm_id, status);

drop policy if exists "Admins manage seller verifications" on public.seller_verifications;
create policy "Admins manage seller verifications"
on public.seller_verifications
for all
to authenticated
using (exists (
  select 1
  from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
))
with check (exists (
  select 1
  from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
));

create or replace function public.automatic_seller_status(email_ok boolean, phone_ok boolean)
returns text
language sql
immutable
as $$
  select case when coalesce(email_ok, false) and coalesce(phone_ok, false) then 'verified' else 'pending_review' end
$$;

create or replace function public.sync_seller_verification_to_farms()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  next_status := public.automatic_seller_status(new.email_verified, new.phone_verified);

  update public.farms f
  set
    email_verified = new.email_verified,
    email_verified_at = new.email_verified_at,
    phone_verified = new.phone_verified,
    phone_verified_at = new.phone_verified_at,
    seller_verification_status = case
      when f.admin_verification_override then f.seller_verification_status
      else next_status
    end,
    verification_updated_at = now(),
    seller_verified_at = case
      when not f.admin_verification_override and next_status = 'verified' then coalesce(f.seller_verified_at, now())
      else f.seller_verified_at
    end
  from public.farm_members fm
  where fm.farm_id = f.id
    and fm.user_id = new.user_id;

  update public.seller_verifications sv
  set
    seller_verification_status = case
      when sv.admin_verification_override then sv.seller_verification_status
      else next_status
    end,
    verification_updated_at = now()
  where sv.id = new.id;

  return new;
end;
$$;

drop trigger if exists sync_seller_verification_to_farms on public.seller_verifications;
create trigger sync_seller_verification_to_farms
after insert or update of email_verified, email_verified_at, phone_verified, phone_verified_at
on public.seller_verifications
for each row execute function public.sync_seller_verification_to_farms();

update public.farms f
set
  email_verified = sv.email_verified,
  email_verified_at = sv.email_verified_at,
  phone_verified = sv.phone_verified,
  phone_verified_at = sv.phone_verified_at,
  seller_verification_status = case
    when f.admin_verification_override then f.seller_verification_status
    else public.automatic_seller_status(sv.email_verified, sv.phone_verified)
  end,
  verification_updated_at = coalesce(f.verification_updated_at, now()),
  seller_verified_at = case
    when not f.admin_verification_override and sv.email_verified and sv.phone_verified then coalesce(f.seller_verified_at, now())
    else f.seller_verified_at
  end
from public.farm_members fm
join public.seller_verifications sv on sv.user_id = fm.user_id
where fm.farm_id = f.id;
