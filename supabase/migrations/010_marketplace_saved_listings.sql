create table if not exists public.marketplace_saved_listings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

alter table public.marketplace_saved_listings enable row level security;

drop policy if exists "Users read saved marketplace listings" on public.marketplace_saved_listings;
create policy "Users read saved marketplace listings" on public.marketplace_saved_listings
for select using (user_id = auth.uid());

drop policy if exists "Users save marketplace listings" on public.marketplace_saved_listings;
create policy "Users save marketplace listings" on public.marketplace_saved_listings
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users remove saved marketplace listings" on public.marketplace_saved_listings;
create policy "Users remove saved marketplace listings" on public.marketplace_saved_listings
for delete using (user_id = auth.uid());

create index if not exists marketplace_saved_listings_user_idx on public.marketplace_saved_listings(user_id);
create index if not exists marketplace_saved_listings_listing_idx on public.marketplace_saved_listings(listing_id);

drop policy if exists "Public can read animals on active marketplace listings" on public.animals;
create policy "Public can read animals on active marketplace listings" on public.animals
for select using (
  exists (
    select 1
    from public.marketplace_listings ml
    where ml.animal_id = public.animals.id
      and ml.status = 'active'
  )
);

drop policy if exists "Public can read media on active marketplace listings" on public.animal_media;
create policy "Public can read media on active marketplace listings" on public.animal_media
for select using (
  exists (
    select 1
    from public.marketplace_listings ml
    where ml.animal_id = public.animal_media.animal_id
      and ml.status = 'active'
  )
);

drop policy if exists "Public can read species on active marketplace listings" on public.species;
create policy "Public can read species on active marketplace listings" on public.species
for select using (
  exists (
    select 1
    from public.animals a
    join public.marketplace_listings ml on ml.animal_id = a.id
    where a.species_id = public.species.id
      and ml.status = 'active'
  )
);
