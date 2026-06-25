alter table public.marketplace_listings
drop constraint if exists marketplace_listings_status_check;

alter table public.marketplace_listings
add constraint marketplace_listings_status_check
check (status in ('draft', 'under_review', 'active', 'reserved', 'sold', 'removed', 'rejected'));

alter table public.marketplace_listings
alter column status set default 'under_review';

alter table public.marketplace_listings
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references public.profiles(id),
add column if not exists rejection_reason text;

drop policy if exists "Seller farms manage listings" on public.marketplace_listings;
create policy "Seller farms manage listings" on public.marketplace_listings
for all
using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]))
with check (
  public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[])
  and status in ('draft', 'under_review', 'reserved', 'sold', 'removed', 'rejected')
);

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farm_members
    where user_id = auth.uid()
      and role = 'owner'
  );
$$;

drop policy if exists "Platform admins read all profiles" on public.profiles;
create policy "Platform admins read all profiles" on public.profiles
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all farms" on public.farms;
create policy "Platform admins read all farms" on public.farms
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all farm memberships" on public.farm_members;
create policy "Platform admins read all farm memberships" on public.farm_members
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all animals" on public.animals;
create policy "Platform admins read all animals" on public.animals
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all animal media" on public.animal_media;
create policy "Platform admins read all animal media" on public.animal_media
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all marketplace listings" on public.marketplace_listings;
create policy "Platform admins read all marketplace listings" on public.marketplace_listings
for select using (public.is_platform_admin());

drop policy if exists "Platform admins review marketplace listings" on public.marketplace_listings;
create policy "Platform admins review marketplace listings" on public.marketplace_listings
for update using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "Platform admins read all offers" on public.marketplace_offers;
create policy "Platform admins read all offers" on public.marketplace_offers
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all transfers" on public.ownership_transfers;
create policy "Platform admins read all transfers" on public.ownership_transfers
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all subscriptions" on public.subscriptions;
create policy "Platform admins read all subscriptions" on public.subscriptions
for select using (public.is_platform_admin());

drop policy if exists "Platform admins read all disputes" on public.disputes;
create policy "Platform admins read all disputes" on public.disputes
for select using (public.is_platform_admin());

drop policy if exists "Platform admins manage disputes" on public.disputes;
create policy "Platform admins manage disputes" on public.disputes
for update using (public.is_platform_admin()) with check (public.is_platform_admin());
