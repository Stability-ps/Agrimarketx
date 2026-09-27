-- 035: production hardening, ADDITIVE part.
--
-- Safe to apply BEFORE deploying the matching application code: it only adds
-- columns, a bucket, a rate-limit store and indexes. Nothing existing is
-- revoked or dropped here. The restrictive part is 036, which must be applied
-- only AFTER the new application code is live.

-- ---------------------------------------------------------------------------
-- 1. Approximate public coordinates for marketplace listings.
--    Exact latitude/longitude become private in 036. The public marketplace
--    only needs ~1 km precision for "near me" sorting and distance labels.
-- ---------------------------------------------------------------------------
alter table public.marketplace_listings
  add column if not exists approx_latitude numeric
    generated always as (round(latitude, 2)) stored,
  add column if not exists approx_longitude numeric
    generated always as (round(longitude, 2)) stored;

-- ---------------------------------------------------------------------------
-- 2. Private bucket for seller verification documents.
--    Only the service role (server) can read/write it; admins review through
--    short-lived signed URLs generated server-side after an admin check.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-verification-documents',
  'seller-verification-documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public media buckets: size and type limits (previously unlimited).
update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
                               -- legacy verification documents still live here until migrated
                               'application/pdf']
where id = 'farm-assets';

update storage.buckets
set file_size_limit = 10485760, -- 10 MB; the app only uploads animal photos
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'animal-media';

-- ---------------------------------------------------------------------------
-- 3. Shared rate-limit store (works across all serverless instances).
--    Keys are SHA-256 hashes built server-side (action + IP/user), so no raw
--    IP addresses or emails are stored. Fixed windows; old rows are pruned.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_buckets (
  key_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key_hash, window_start)
);

alter table public.rate_limit_buckets enable row level security;
-- No policies: only the service role (which bypasses RLS) may touch it.
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_key_hash is null or length(p_key_hash) < 16 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_buckets as b (key_hash, window_start, hits)
  values (p_key_hash, v_window, 1)
  on conflict (key_hash, window_start) do update set hits = b.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup (~1% of calls) keeps the table small.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Foreign-key indexes that real queries and RLS checks use.
--    (Deliberately not all ~70 unindexed FKs: audit columns such as
--    created_by/reviewed_by are rarely filtered on.)
-- ---------------------------------------------------------------------------
-- Every public animal/media/species policy joins listings on animal_id.
create index if not exists marketplace_listings_animal_idx on public.marketplace_listings(animal_id);
create index if not exists animal_media_animal_idx on public.animal_media(animal_id);
create index if not exists marketplace_listing_media_farm_idx on public.marketplace_listing_media(seller_farm_id);
create index if not exists marketplace_offers_listing_idx on public.marketplace_offers(listing_id);
create index if not exists marketplace_offers_buyer_idx on public.marketplace_offers(buyer_id);
create index if not exists marketplace_enquiries_buyer_idx on public.marketplace_enquiries(buyer_user_id);
-- Messaging: inbox lists and can_access_conversation().
create index if not exists conversations_buyer_idx on public.conversations(buyer_user_id);
create index if not exists conversations_seller_farm_idx on public.conversations(seller_farm_id);
create index if not exists conversation_participants_conversation_idx on public.conversation_participants(conversation_id);
create index if not exists conversation_messages_sender_user_idx on public.conversation_messages(sender_user_id);
-- Ownership transfers (buyer/seller views).
create index if not exists ownership_transfers_buyer_user_idx on public.ownership_transfers(buyer_user_id);
create index if not exists ownership_transfers_seller_farm_idx on public.ownership_transfers(seller_farm_id);
create index if not exists ownership_transfers_animal_idx on public.ownership_transfers(animal_id);
-- Farm records, always filtered by farm and/or animal.
create index if not exists health_records_farm_idx on public.health_records(farm_id);
create index if not exists health_records_animal_idx on public.health_records(animal_id);
create index if not exists breeding_records_farm_idx on public.breeding_records(farm_id);
create index if not exists birth_records_farm_idx on public.birth_records(farm_id);
create index if not exists finance_transactions_farm_idx on public.finance_transactions(farm_id);
create index if not exists finance_transactions_animal_idx on public.finance_transactions(animal_id);
create index if not exists weight_records_animal_idx on public.weight_records(animal_id);
create index if not exists animal_documents_animal_idx on public.animal_documents(animal_id);
create index if not exists herds_farm_idx on public.herds(farm_id);
create index if not exists camps_farm_idx on public.camps(farm_id);
