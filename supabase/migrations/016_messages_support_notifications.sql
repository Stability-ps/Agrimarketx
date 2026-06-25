create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct'
    check (type in ('direct', 'marketplace', 'support', 'admin')),
  subject text not null,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  support_ticket_id uuid,
  buyer_user_id uuid references public.profiles(id) on delete set null,
  seller_farm_id uuid references public.farms(id) on delete set null,
  admin_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'waiting', 'closed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  role text not null default 'member'
    check (role in ('buyer', 'seller', 'admin', 'support', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid references public.profiles(id) on delete set null,
  sender_farm_id uuid references public.farms(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('ASX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_by uuid references public.profiles(id) on delete set null,
  farm_id uuid references public.farms(id) on delete set null,
  category text not null default 'support',
  subject text not null,
  description text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations
drop constraint if exists conversations_support_ticket_id_fkey;
alter table public.conversations
add constraint conversations_support_ticket_id_fkey
foreign key (support_ticket_id) references public.support_tickets(id) on delete set null;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'general',
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.app_notifications enable row level security;

create or replace function public.can_access_conversation(conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = can_access_conversation.conversation_id
        and (
          cp.user_id = auth.uid()
          or (cp.farm_id is not null and public.is_farm_member(cp.farm_id))
        )
    );
$$;

drop policy if exists "Conversation participants read conversations" on public.conversations;
create policy "Conversation participants read conversations" on public.conversations
for select using (public.can_access_conversation(id));

drop policy if exists "Users create conversations" on public.conversations;
create policy "Users create conversations" on public.conversations
for insert with check (created_by = auth.uid() or public.is_platform_admin());

drop policy if exists "Participants update conversations" on public.conversations;
create policy "Participants update conversations" on public.conversations
for update using (public.can_access_conversation(id))
with check (public.can_access_conversation(id));

drop policy if exists "Participants read conversation participants" on public.conversation_participants;
create policy "Participants read conversation participants" on public.conversation_participants
for select using (public.can_access_conversation(conversation_id));

drop policy if exists "Users create conversation participants" on public.conversation_participants;
create policy "Users create conversation participants" on public.conversation_participants
for insert with check (
  user_id = auth.uid()
  or (farm_id is not null and public.is_farm_member(farm_id))
  or public.is_platform_admin()
);

drop policy if exists "Participants read messages" on public.conversation_messages;
create policy "Participants read messages" on public.conversation_messages
for select using (public.can_access_conversation(conversation_id));

drop policy if exists "Participants send messages" on public.conversation_messages;
create policy "Participants send messages" on public.conversation_messages
for insert with check (
  public.can_access_conversation(conversation_id)
  and (
    sender_user_id = auth.uid()
    or (sender_farm_id is not null and public.is_farm_member(sender_farm_id))
    or public.is_platform_admin()
  )
);

drop policy if exists "Users read own tickets" on public.support_tickets;
create policy "Users read own tickets" on public.support_tickets
for select using (
  created_by = auth.uid()
  or (farm_id is not null and public.is_farm_member(farm_id))
  or public.is_platform_admin()
);

drop policy if exists "Users create support tickets" on public.support_tickets;
create policy "Users create support tickets" on public.support_tickets
for insert with check (created_by = auth.uid() or public.is_platform_admin());

drop policy if exists "Users update own support tickets" on public.support_tickets;
create policy "Users update own support tickets" on public.support_tickets
for update using (
  created_by = auth.uid()
  or (farm_id is not null and public.has_farm_role(farm_id, array['owner','manager']::public.app_role[]))
  or public.is_platform_admin()
) with check (
  created_by = auth.uid()
  or (farm_id is not null and public.has_farm_role(farm_id, array['owner','manager']::public.app_role[]))
  or public.is_platform_admin()
);

drop policy if exists "Users read own notifications" on public.app_notifications;
create policy "Users read own notifications" on public.app_notifications
for select using (
  user_id = auth.uid()
  or (farm_id is not null and public.is_farm_member(farm_id))
  or public.is_platform_admin()
);

drop policy if exists "Users update own notifications" on public.app_notifications;
create policy "Users update own notifications" on public.app_notifications
for update using (
  user_id = auth.uid()
  or (farm_id is not null and public.is_farm_member(farm_id))
  or public.is_platform_admin()
) with check (
  user_id = auth.uid()
  or (farm_id is not null and public.is_farm_member(farm_id))
  or public.is_platform_admin()
);

drop policy if exists "System creates notifications" on public.app_notifications;
create policy "System creates notifications" on public.app_notifications
for insert with check (true);

create index if not exists conversations_listing_idx on public.conversations(listing_id);
create index if not exists conversation_messages_conversation_idx on public.conversation_messages(conversation_id, created_at);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists app_notifications_user_idx on public.app_notifications(user_id, created_at);
create index if not exists app_notifications_farm_idx on public.app_notifications(farm_id, created_at);
