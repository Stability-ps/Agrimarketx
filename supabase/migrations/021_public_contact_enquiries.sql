create table if not exists public.public_contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  enquiry_type text not null default 'support',
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'closed')),
  admin_note text,
  created_at timestamptz not null default now()
);

alter table public.public_contact_enquiries enable row level security;

drop policy if exists "Anyone can create public contact enquiries" on public.public_contact_enquiries;
create policy "Anyone can create public contact enquiries" on public.public_contact_enquiries
for insert with check (true);

drop policy if exists "Platform admins manage public contact enquiries" on public.public_contact_enquiries;
create policy "Platform admins manage public contact enquiries" on public.public_contact_enquiries
for all using (public.is_platform_admin())
with check (public.is_platform_admin());

create index if not exists public_contact_enquiries_status_idx on public.public_contact_enquiries(status);
create index if not exists public_contact_enquiries_created_at_idx on public.public_contact_enquiries(created_at desc);
