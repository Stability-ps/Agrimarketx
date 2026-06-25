alter table public.profiles
add column if not exists whatsapp_number text;

alter table public.farms
add column if not exists description text,
add column if not exists photo_url text,
add column if not exists seller_verification_status text not null default 'not_started'
  check (seller_verification_status in ('not_started', 'pending_review', 'verified', 'rejected', 'suspended')),
add column if not exists seller_verification_reason text,
add column if not exists seller_verification_submitted_at timestamptz,
add column if not exists seller_verified_at timestamptz;

alter table public.marketplace_listings
drop constraint if exists marketplace_listings_status_check;

alter table public.marketplace_listings
add constraint marketplace_listings_status_check
check (status in ('draft', 'under_review', 'active', 'reserved', 'sold', 'paused', 'removed', 'rejected'));

alter table public.marketplace_listings
add column if not exists views_count int not null default 0,
add column if not exists contact_clicks_count int not null default 0,
add column if not exists whatsapp_clicks_count int not null default 0,
add column if not exists call_clicks_count int not null default 0,
add column if not exists saved_count int not null default 0,
add column if not exists expires_at date;

alter table public.disputes
add column if not exists admin_notes text;

drop policy if exists "Seller farms manage listings" on public.marketplace_listings;
create policy "Seller farms manage listings" on public.marketplace_listings
for all
using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]))
with check (
  public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[])
  and status in ('draft', 'under_review', 'reserved', 'sold', 'paused', 'removed', 'rejected')
);

create table if not exists public.marketplace_listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  seller_farm_id uuid not null references public.farms(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'photo' check (media_type in ('photo', 'video')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.marketplace_listing_media enable row level security;

drop policy if exists "Public can read active listing media" on public.marketplace_listing_media;
create policy "Public can read active listing media" on public.marketplace_listing_media
for select using (
  exists (
    select 1 from public.marketplace_listings ml
    where ml.id = marketplace_listing_media.listing_id
      and ml.status = 'active'
  )
);

drop policy if exists "Seller farms manage listing media" on public.marketplace_listing_media;
create policy "Seller farms manage listing media" on public.marketplace_listing_media
for all using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]))
with check (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]));

drop policy if exists "Platform admins read listing media" on public.marketplace_listing_media;
create policy "Platform admins read listing media" on public.marketplace_listing_media
for select using (public.is_platform_admin());

create table if not exists public.farm_followers (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (farm_id, user_id)
);

alter table public.farm_followers enable row level security;

drop policy if exists "Users read own followed farms" on public.farm_followers;
create policy "Users read own followed farms" on public.farm_followers
for select using (user_id = auth.uid());

drop policy if exists "Users follow farms" on public.farm_followers;
create policy "Users follow farms" on public.farm_followers
for insert with check (user_id = auth.uid());

drop policy if exists "Users unfollow farms" on public.farm_followers;
create policy "Users unfollow farms" on public.farm_followers
for delete using (user_id = auth.uid());

create or replace function public.increment_listing_metric(listing_id uuid, metric text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.marketplace_listings
  set
    views_count = views_count + case when metric = 'view' then 1 else 0 end,
    contact_clicks_count = contact_clicks_count + case when metric = 'contact' then 1 else 0 end,
    whatsapp_clicks_count = whatsapp_clicks_count + case when metric = 'whatsapp' then 1 else 0 end,
    call_clicks_count = call_clicks_count + case when metric = 'call' then 1 else 0 end
  where id = listing_id;
end;
$$;

create or replace function public.refresh_listing_saved_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.marketplace_listings
  set saved_count = (
    select count(*)::int
    from public.marketplace_saved_listings msl
    where msl.listing_id = coalesce(new.listing_id, old.listing_id)
  )
  where id = coalesce(new.listing_id, old.listing_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists marketplace_saved_count_insert on public.marketplace_saved_listings;
create trigger marketplace_saved_count_insert
after insert on public.marketplace_saved_listings
for each row execute function public.refresh_listing_saved_count();

drop trigger if exists marketplace_saved_count_delete on public.marketplace_saved_listings;
create trigger marketplace_saved_count_delete
after delete on public.marketplace_saved_listings
for each row execute function public.refresh_listing_saved_count();

drop policy if exists "Public can read farm profiles" on public.farms;
create policy "Public can read farm profiles" on public.farms
for select using (true);
