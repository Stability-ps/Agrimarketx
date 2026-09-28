-- 040: fix starting marketplace chats (pre-existing bug, found in production QA).
--
-- Conversations were only readable through can_access_conversation(), which
-- looks at conversation_participants. When a buyer creates a conversation the
-- app does INSERT ... RETURNING id before any participant exists, so the new
-- row was not readable and Postgres rejected the insert (RLS 42501): buyers
-- could not start chats. The buyer also could not add the seller farm as a
-- participant, so sellers could not reply either.

-- 1. The conversation's own parties can read it (row columns only, so this also
--    works for INSERT ... RETURNING).
drop policy if exists "Conversation parties read conversations" on public.conversations;
create policy "Conversation parties read conversations"
on public.conversations for select to authenticated
using (
  buyer_user_id = auth.uid()
  or created_by = auth.uid()
  or (seller_farm_id is not null and public.is_farm_member(seller_farm_id))
);

-- 2. The same parties pass can_access_conversation() (used by the participant
--    and message policies), even before participant rows exist.
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
    )
    or exists (
      select 1
      from public.conversations c
      where c.id = can_access_conversation.conversation_id
        and (
          c.buyer_user_id = auth.uid()
          or c.created_by = auth.uid()
          or (c.seller_farm_id is not null and public.is_farm_member(c.seller_farm_id))
        )
    );
$$;

revoke execute on function public.can_access_conversation(uuid) from public, anon;
grant execute on function public.can_access_conversation(uuid) to authenticated;

-- 3. Whoever created the conversation may add the listing's seller farm as a
--    participant (and only that farm).
drop policy if exists "Conversation creators add seller participant" on public.conversation_participants;
create policy "Conversation creators add seller participant"
on public.conversation_participants for insert to authenticated
with check (
  farm_id is not null
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_participants.conversation_id
      and c.created_by = auth.uid()
      and c.seller_farm_id = conversation_participants.farm_id
  )
);
