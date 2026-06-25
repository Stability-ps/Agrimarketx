alter table public.farms
add column if not exists supply_categories text[] not null default '{}';

create table if not exists public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  province text,
  town text,
  quantity text,
  budget text,
  contact_preference text,
  status text not null default 'pending_review'
    check (status in ('draft', 'pending_review', 'approved', 'published', 'matched', 'closed', 'rejected', 'removed')),
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buyer_request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_requests(id) on delete cascade,
  seller_farm_id uuid not null references public.farms(id) on delete cascade,
  seller_user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  quote_amount numeric,
  available_quantity text,
  delivery_option text,
  contact_preference text,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now()
);

alter table public.buyer_requests enable row level security;
alter table public.buyer_request_responses enable row level security;

drop policy if exists "Public read published buyer requests" on public.buyer_requests;
create policy "Public read published buyer requests" on public.buyer_requests
for select using (status in ('approved', 'published', 'matched'));

drop policy if exists "Buyers manage own requests" on public.buyer_requests;
create policy "Buyers manage own requests" on public.buyer_requests
for all to authenticated
using (buyer_id = auth.uid())
with check (buyer_id = auth.uid());

drop policy if exists "Admins manage buyer requests" on public.buyer_requests;
create policy "Admins manage buyer requests" on public.buyer_requests
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_role in ('admin', 'super_admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_role in ('admin', 'super_admin')));

drop policy if exists "Request participants read responses" on public.buyer_request_responses;
create policy "Request participants read responses" on public.buyer_request_responses
for select to authenticated
using (
  seller_user_id = auth.uid()
  or public.is_farm_member(seller_farm_id)
  or exists (select 1 from public.buyer_requests br where br.id = request_id and br.buyer_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_role in ('admin', 'super_admin'))
);

drop policy if exists "Sellers respond to buyer requests" on public.buyer_request_responses;
create policy "Sellers respond to buyer requests" on public.buyer_request_responses
for insert to authenticated
with check (seller_user_id = auth.uid() and public.is_farm_member(seller_farm_id));

drop policy if exists "Sellers update own responses" on public.buyer_request_responses;
create policy "Sellers update own responses" on public.buyer_request_responses
for update to authenticated
using (seller_user_id = auth.uid() or public.is_farm_member(seller_farm_id))
with check (seller_user_id = auth.uid() or public.is_farm_member(seller_farm_id));
