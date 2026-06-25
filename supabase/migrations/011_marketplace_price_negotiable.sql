alter table public.marketplace_listings
add column if not exists price_negotiable boolean not null default true;
