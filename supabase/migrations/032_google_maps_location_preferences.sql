alter table public.profiles
add column if not exists preferred_location text,
add column if not exists preferred_latitude numeric(10, 7),
add column if not exists preferred_longitude numeric(10, 7),
add column if not exists preferred_location_radius text default '25';

alter table public.marketplace_listings
add column if not exists latitude numeric(10, 7),
add column if not exists longitude numeric(10, 7);

create index if not exists marketplace_listings_lat_lng_idx
on public.marketplace_listings(latitude, longitude)
where latitude is not null and longitude is not null;

create index if not exists marketplace_listings_status_province_town_created_idx
on public.marketplace_listings(status, province, town, created_at desc);

create or replace function public.marketplace_distance_km(
  from_lat double precision,
  from_lng double precision,
  to_lat double precision,
  to_lng double precision
)
returns double precision
language sql
immutable
as $$
  select 6371 * 2 * atan2(
    sqrt(
      power(sin(radians(to_lat - from_lat) / 2), 2) +
      cos(radians(from_lat)) * cos(radians(to_lat)) *
      power(sin(radians(to_lng - from_lng) / 2), 2)
    ),
    sqrt(
      1 - (
        power(sin(radians(to_lat - from_lat) / 2), 2) +
        cos(radians(from_lat)) * cos(radians(to_lat)) *
        power(sin(radians(to_lng - from_lng) / 2), 2)
      )
    )
  );
$$;
