create table if not exists public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  didit_session_id text unique,
  status text not null default 'not_started'
    check (status in ('not_started', 'pending', 'approved', 'declined', 'resubmission_required')),
  verification_score numeric(5,2),
  decision text,
  webhook_event_ids text[] not null default '{}',
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists seller_verifications_user_id_idx on public.seller_verifications(user_id);
create index if not exists seller_verifications_status_idx on public.seller_verifications(status);
create index if not exists seller_verifications_didit_session_id_idx on public.seller_verifications(didit_session_id);

create table if not exists public.seller_verification_events (
  id uuid primary key default gen_random_uuid(),
  seller_verification_id uuid references public.seller_verifications(id) on delete set null,
  didit_session_id text,
  event_id text unique,
  event_type text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  error text,
  received_at timestamptz not null default now()
);

create index if not exists seller_verification_events_session_idx on public.seller_verification_events(didit_session_id);
create index if not exists seller_verification_events_received_idx on public.seller_verification_events(received_at desc);

create or replace function public.touch_seller_verifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_seller_verifications_updated_at on public.seller_verifications;
create trigger touch_seller_verifications_updated_at
before update on public.seller_verifications
for each row execute function public.touch_seller_verifications_updated_at();

alter table public.seller_verifications enable row level security;
alter table public.seller_verification_events enable row level security;

drop policy if exists "Users can read own seller verification" on public.seller_verifications;
create policy "Users can read own seller verification"
on public.seller_verifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can read seller verifications" on public.seller_verifications;
create policy "Admins can read seller verifications"
on public.seller_verifications
for select
to authenticated
using (exists (
  select 1
  from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
));

drop policy if exists "Admins can read seller verification events" on public.seller_verification_events;
create policy "Admins can read seller verification events"
on public.seller_verification_events
for select
to authenticated
using (exists (
  select 1
  from public.profiles p
  where p.id = auth.uid()
    and p.account_role in ('admin', 'super_admin')
));
