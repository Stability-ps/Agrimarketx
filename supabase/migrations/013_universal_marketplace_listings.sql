alter table public.marketplace_listings
alter column animal_id drop not null;

alter table public.marketplace_listings
add column if not exists category text not null default 'livestock',
add column if not exists listing_details jsonb not null default '{}'::jsonb;

alter table public.marketplace_listings
drop constraint if exists marketplace_listings_category_check;

alter table public.marketplace_listings
add constraint marketplace_listings_category_check
check (category in (
  'livestock',
  'feed_nutrition',
  'crops_seeds',
  'farm_produce',
  'equipment_machinery',
  'animal_health',
  'services',
  'other_agricultural_products'
));

alter table public.marketplace_listings
drop constraint if exists marketplace_listings_status_check;

alter table public.marketplace_listings
add constraint marketplace_listings_status_check
check (status in ('draft', 'under_review', 'active', 'reserved', 'sold', 'removed', 'rejected'));

alter table public.marketplace_listings
alter column status set default 'under_review';
