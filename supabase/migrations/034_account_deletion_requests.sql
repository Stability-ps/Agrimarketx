create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  reason text,
  source text not null default 'web' check (source in ('web','app')),
  status text not null default 'requested' check (status in ('requested','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  admin_note text
);

alter table public.account_deletion_requests enable row level security;

create policy "Users can read own deletion requests"
on public.account_deletion_requests
for select to authenticated
using (user_id = auth.uid());

create index if not exists account_deletion_requests_email_idx
on public.account_deletion_requests (lower(email), requested_at desc);

create index if not exists account_deletion_requests_user_idx
on public.account_deletion_requests (user_id, requested_at desc);
