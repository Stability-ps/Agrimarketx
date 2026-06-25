alter table public.marketplace_listings
add column if not exists seller_contact_name text,
add column if not exists seller_contact_phone text,
add column if not exists seller_contact_whatsapp text,
add column if not exists seller_contact_email text,
add column if not exists preferred_contact_method text not null default 'whatsapp'
  check (preferred_contact_method in ('call', 'whatsapp', 'email'));

create table if not exists public.marketplace_enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  seller_farm_id uuid not null references public.farms(id) on delete cascade,
  buyer_user_id uuid references public.profiles(id) on delete set null,
  buyer_name text not null,
  buyer_phone text,
  buyer_email text,
  preferred_contact_method text not null default 'whatsapp'
    check (preferred_contact_method in ('call', 'whatsapp', 'email')),
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.marketplace_enquiries enable row level security;

drop policy if exists "Anyone can create marketplace enquiries" on public.marketplace_enquiries;
create policy "Anyone can create marketplace enquiries" on public.marketplace_enquiries
for insert with check (true);

drop policy if exists "Sellers read their marketplace enquiries" on public.marketplace_enquiries;
create policy "Sellers read their marketplace enquiries" on public.marketplace_enquiries
for select using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]));

drop policy if exists "Sellers update their marketplace enquiries" on public.marketplace_enquiries;
create policy "Sellers update their marketplace enquiries" on public.marketplace_enquiries
for update using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]))
with check (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]));

drop policy if exists "Platform admins read all enquiries" on public.marketplace_enquiries;
create policy "Platform admins read all enquiries" on public.marketplace_enquiries
for select using (public.is_platform_admin());

create index if not exists marketplace_enquiries_listing_idx on public.marketplace_enquiries(listing_id);
create index if not exists marketplace_enquiries_seller_farm_idx on public.marketplace_enquiries(seller_farm_id);

drop policy if exists "Anyone can report marketplace listings" on public.disputes;
create policy "Anyone can report marketplace listings" on public.disputes
for insert with check (listing_id is not null);
