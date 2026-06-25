create extension if not exists pg_trgm;

create index if not exists marketplace_listings_title_trgm_idx
on public.marketplace_listings using gin (title gin_trgm_ops);

create index if not exists marketplace_listings_description_trgm_idx
on public.marketplace_listings using gin (description gin_trgm_ops);

create index if not exists marketplace_listings_location_trgm_idx
on public.marketplace_listings using gin ((coalesce(town, '') || ' ' || coalesce(province, '') || ' ' || coalesce(approximate_location, '')) gin_trgm_ops);

create index if not exists marketplace_listings_details_gin_idx
on public.marketplace_listings using gin (listing_details);

create index if not exists buyer_requests_title_trgm_idx
on public.buyer_requests using gin (title gin_trgm_ops);

create index if not exists buyer_requests_location_trgm_idx
on public.buyer_requests using gin ((coalesce(town, '') || ' ' || coalesce(province, '') || ' ' || coalesce(approximate_location, '')) gin_trgm_ops);
