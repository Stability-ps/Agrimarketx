create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  province text not null,
  town text not null,
  slug text not null,
  created_by uuid references public.profiles(id) on delete set null,
  usage_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (province, town)
);

alter table public.locations enable row level security;

drop policy if exists "Public read locations" on public.locations;
create policy "Public read locations" on public.locations
for select using (true);

drop policy if exists "Authenticated create locations" on public.locations;
create policy "Authenticated create locations" on public.locations
for insert to authenticated
with check (created_by = auth.uid() or created_by is null);

alter table public.buyer_requests
add column if not exists subcategory text,
add column if not exists approximate_location text,
add column if not exists urgency text not null default 'flexible'
  check (urgency in ('urgent', 'needed_soon', 'flexible')),
add column if not exists needed_by date;

create table if not exists public.buyer_request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'photo',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.buyer_request_media enable row level security;

drop policy if exists "Public read approved request media" on public.buyer_request_media;
create policy "Public read approved request media" on public.buyer_request_media
for select using (
  exists (
    select 1 from public.buyer_requests br
    where br.id = buyer_request_media.request_id
      and br.status in ('approved', 'published', 'matched')
  )
  or exists (
    select 1 from public.buyer_requests br
    where br.id = buyer_request_media.request_id
      and br.buyer_id = auth.uid()
  )
  or public.is_platform_admin()
);

drop policy if exists "Buyer creates request media" on public.buyer_request_media;
create policy "Buyer creates request media" on public.buyer_request_media
for insert to authenticated
with check (
  exists (
    select 1 from public.buyer_requests br
    where br.id = buyer_request_media.request_id
      and br.buyer_id = auth.uid()
  )
);
