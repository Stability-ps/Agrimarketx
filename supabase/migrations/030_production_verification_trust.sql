alter table public.farms
drop constraint if exists farms_seller_verification_status_check;

alter table public.farms
drop constraint if exists farms_seller_account_role_check;

alter table public.seller_verifications
drop constraint if exists seller_verifications_seller_verification_status_check;

alter table public.seller_verifications
drop constraint if exists seller_verifications_account_role_check;

alter table public.farms
add column if not exists seller_type text not null default 'individual',
add column if not exists document_status text not null default 'not_submitted',
add column if not exists facial_verification_status text not null default 'not_started',
add column if not exists business_name text,
add column if not exists trading_name text,
add column if not exists registration_number text,
add column if not exists vat_number text,
add column if not exists contact_person text,
add column if not exists contact_person_position text,
add column if not exists city text,
add column if not exists physical_address text,
add column if not exists business_type text,
add column if not exists business_description text,
add column if not exists business_logo_url text,
add column if not exists representative_name text,
add column if not exists representative_role text,
add column if not exists representative_email text,
add column if not exists representative_phone text,
add column if not exists representative_verification_status text not null default 'not_required',
add column if not exists representative_verification_required boolean not null default false,
add column if not exists representative_verified_at timestamptz,
add column if not exists didit_session_id text,
add column if not exists didit_verification_id text,
add column if not exists facial_didit_session_id text,
add column if not exists facial_didit_verification_id text,
add column if not exists verification_email_sent_at timestamptz,
add column if not exists facial_email_sent_at timestamptz,
add column if not exists verification_email_status text not null default 'not_sent',
add column if not exists facial_email_status text not null default 'not_sent',
add column if not exists sponsored_partner boolean not null default false;

alter table public.farms
add constraint farms_seller_verification_status_check
check (seller_verification_status in (
  'not_started',
  'pending',
  'pending_review',
  'documents_submitted',
  'documents_approved_pending_facial_verification',
  'facial_verification_pending',
  'verified',
  'rejected',
  'suspended',
  'more_information_required'
));

alter table public.farms
add constraint farms_seller_type_check
check (seller_type in ('individual', 'business'));

alter table public.farms
add constraint farms_document_status_check
check (document_status in ('not_submitted', 'submitted', 'approved', 'rejected', 'more_information_required'));

alter table public.farms
add constraint farms_facial_verification_status_check
check (facial_verification_status in ('not_started', 'pending', 'verified', 'failed', 'expired'));

alter table public.farms
add constraint farms_representative_verification_status_check
check (representative_verification_status in ('not_required', 'pending', 'verified', 'failed', 'expired'));

alter table public.farms
add constraint farms_seller_account_role_check
check (seller_account_role in (
  'individual_seller',
  'business_seller',
  'sponsored_partner',
  'farmer_seller',
  'shop_seller',
  'service_provider',
  'advertiser',
  'admin_created_seller',
  'super_admin'
));

alter table public.seller_verifications
add column if not exists seller_type text not null default 'individual',
add column if not exists document_status text not null default 'not_submitted',
add column if not exists facial_verification_status text not null default 'not_started',
add column if not exists business_name text,
add column if not exists representative_name text,
add column if not exists representative_role text,
add column if not exists representative_email text,
add column if not exists representative_phone text,
add column if not exists representative_verification_status text not null default 'not_required',
add column if not exists representative_verification_required boolean not null default false,
add column if not exists representative_verified_at timestamptz,
add column if not exists facial_didit_session_id text,
add column if not exists facial_didit_verification_id text,
add column if not exists verification_email_sent_at timestamptz,
add column if not exists facial_email_sent_at timestamptz,
add column if not exists verification_email_status text not null default 'not_sent',
add column if not exists facial_email_status text not null default 'not_sent',
add column if not exists sponsored_partner boolean not null default false;

alter table public.seller_verifications
add constraint seller_verifications_seller_verification_status_check
check (seller_verification_status in (
  'not_started',
  'pending',
  'pending_review',
  'documents_submitted',
  'documents_approved_pending_facial_verification',
  'facial_verification_pending',
  'verified',
  'rejected',
  'suspended',
  'more_information_required'
));

alter table public.seller_verifications
add constraint seller_verifications_seller_type_check
check (seller_type in ('individual', 'business'));

alter table public.seller_verifications
add constraint seller_verifications_document_status_check
check (document_status in ('not_submitted', 'submitted', 'approved', 'rejected', 'more_information_required'));

alter table public.seller_verifications
add constraint seller_verifications_facial_verification_status_check
check (facial_verification_status in ('not_started', 'pending', 'verified', 'failed', 'expired'));

alter table public.seller_verifications
add constraint seller_verifications_representative_verification_status_check
check (representative_verification_status in ('not_required', 'pending', 'verified', 'failed', 'expired'));

alter table public.seller_verifications
add constraint seller_verifications_account_role_check
check (account_role in (
  'individual_seller',
  'business_seller',
  'sponsored_partner',
  'farmer_seller',
  'shop_seller',
  'service_provider',
  'advertiser',
  'admin_created_seller',
  'super_admin'
));

create table if not exists public.seller_verification_documents (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  file_name text,
  created_at timestamptz not null default now()
);

alter table public.seller_verification_documents enable row level security;

drop policy if exists "Farm owners manage verification documents" on public.seller_verification_documents;
create policy "Farm owners manage verification documents"
on public.seller_verification_documents
for all
to authenticated
using (exists (
  select 1
  from public.farm_members fm
  where fm.farm_id = seller_verification_documents.farm_id
    and fm.user_id = auth.uid()
))
with check (exists (
  select 1
  from public.farm_members fm
  where fm.farm_id = seller_verification_documents.farm_id
    and fm.user_id = auth.uid()
));

drop policy if exists "Admins manage verification documents" on public.seller_verification_documents;
create policy "Admins manage verification documents"
on public.seller_verification_documents
for all
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
));

create index if not exists seller_verification_documents_farm_idx
on public.seller_verification_documents(farm_id, created_at desc);

create index if not exists farms_seller_type_status_idx
on public.farms(seller_type, seller_verification_status, document_status, facial_verification_status);

create or replace function public.automatic_seller_status(
  email_ok boolean,
  phone_ok boolean,
  seller_kind text,
  document_state text,
  facial_state text
)
returns text
language sql
immutable
as $$
  select case
    when not coalesce(email_ok, false) or not coalesce(phone_ok, false) then 'pending'
    when coalesce(seller_kind, 'individual') = 'business' and coalesce(document_state, 'not_submitted') = 'approved' and coalesce(facial_state, 'not_started') = 'verified' then 'verified'
    when coalesce(seller_kind, 'individual') = 'business' and coalesce(document_state, 'not_submitted') = 'approved' then 'documents_approved_pending_facial_verification'
    when coalesce(seller_kind, 'individual') = 'business' and coalesce(document_state, 'not_submitted') in ('submitted') then 'documents_submitted'
    when coalesce(seller_kind, 'individual') = 'business' and coalesce(document_state, 'not_submitted') = 'more_information_required' then 'more_information_required'
    when coalesce(seller_kind, 'individual') = 'business' and coalesce(document_state, 'not_submitted') = 'rejected' then 'rejected'
    when coalesce(seller_kind, 'individual') = 'individual' and coalesce(facial_state, 'not_started') = 'verified' then 'verified'
    when coalesce(facial_state, 'not_started') = 'pending' then 'facial_verification_pending'
    else 'pending'
  end
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
  next_status := public.automatic_seller_status(
    new.email_verified,
    new.phone_verified,
    new.seller_type,
    new.document_status,
    new.facial_verification_status
  );

  update public.farms f
  set
    email_verified = new.email_verified,
    email_verified_at = new.email_verified_at,
    phone_verified = new.phone_verified,
    phone_verified_at = new.phone_verified_at,
    seller_type = coalesce(new.seller_type, f.seller_type),
    document_status = coalesce(new.document_status, f.document_status),
    facial_verification_status = coalesce(new.facial_verification_status, f.facial_verification_status),
    representative_verification_status = coalesce(new.representative_verification_status, f.representative_verification_status),
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
after insert or update of
  email_verified,
  email_verified_at,
  phone_verified,
  phone_verified_at,
  seller_type,
  document_status,
  facial_verification_status,
  representative_verification_status
on public.seller_verifications
for each row execute function public.sync_seller_verification_to_farms();

update public.farms
set
  seller_type = case when seller_account_role in ('shop_seller', 'business_seller', 'sponsored_partner') then 'business' else 'individual' end,
  seller_account_role = case
    when seller_account_role = 'shop_seller' then 'business_seller'
    when seller_account_role = 'advertiser' then 'sponsored_partner'
    else seller_account_role
  end
where seller_type is null
   or seller_account_role in ('shop_seller', 'advertiser');

update public.farms
set seller_verification_status = 'pending'
where seller_verification_status in ('not_started', 'pending_review')
  and coalesce(email_verified, false) = false
  and coalesce(phone_verified, false) = false;
