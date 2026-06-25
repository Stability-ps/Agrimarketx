alter table public.marketplace_listings
add column if not exists subcategory text;

alter table public.marketplace_listings
drop constraint if exists marketplace_listings_category_check;

update public.marketplace_listings
set category = case
  when category = 'feed_nutrition' then 'feed_inputs'
  when category in ('crops_seeds', 'farm_produce') then 'crops_produce'
  when category = 'services' then 'agri_services'
  when category in ('animal_health', 'animal_health_products') then 'feed_inputs'
  when category = 'equipment_machinery'
    and (
      lower(coalesce(title, '')) like any (array['%bakkie%', '%hilux%', '%gd6%', '%truck%', '%vehicle%', '%trailer%', '%car%'])
      or listing_details ? 'kilometres'
      or listing_details ? 'transmission'
    )
    then 'vehicles'
  when category = 'equipment_machinery' then 'farm_equipment'
  when category = 'other_agricultural_products'
    and lower(coalesce(title, '')) like any (array['%service%', '%transport%', '%consult%', '%labour%', '%vet%', '%plough%'])
    then 'agri_services'
  when category = 'other_agricultural_products'
    and lower(coalesce(title, '')) like any (array['%maize%', '%egg%', '%potato%', '%tomato%', '%honey%', '%produce%', '%crop%'])
    then 'crops_produce'
  when category = 'other_agricultural_products'
    and lower(coalesce(title, '')) like any (array['%feed%', '%lucerne%', '%fertilizer%', '%seed%', '%medicine%', '%vaccine%'])
    then 'feed_inputs'
  when category = 'other_agricultural_products' then 'infrastructure'
  else category
end;

update public.marketplace_listings
set subcategory = coalesce(
  nullif(subcategory, ''),
  nullif(listing_details->>'subcategory', ''),
  case
    when category = 'vehicles'
      and lower(coalesce(title, '')) like any (array['%bakkie%', '%hilux%', '%gd6%'])
      then 'bakkies'
    when category = 'vehicles'
      and lower(coalesce(title, '')) like any (array['%car%', '%vehicle%'])
      then 'cars'
    when category = 'vehicles'
      and lower(coalesce(title, '')) like '%trailer%'
      then 'trailers'
    when category = 'farm_equipment'
      and lower(coalesce(title, '')) like '%tractor%'
      then 'tractors'
    when category = 'feed_inputs'
      and lower(coalesce(title, '')) like any (array['%lucerne%', '%hay%'])
      then 'lucerne'
    when category = 'crops_produce'
      and lower(coalesce(title, '')) like '%egg%'
      then 'eggs'
    else null
  end
);

alter table public.marketplace_listings
add constraint marketplace_listings_category_check
check (category in (
  'livestock',
  'livestock_herds',
  'feed_inputs',
  'crops_produce',
  'farm_equipment',
  'vehicles',
  'infrastructure',
  'agri_services'
));

create index if not exists marketplace_listings_category_idx
on public.marketplace_listings(category);

create index if not exists marketplace_listings_category_subcategory_idx
on public.marketplace_listings(category, subcategory);

create index if not exists marketplace_listings_location_idx
on public.marketplace_listings(province, town);

update public.buyer_requests
set category = case
  when category = 'feed_nutrition' then 'feed_inputs'
  when category in ('crops_seeds', 'farm_produce') then 'crops_produce'
  when category = 'equipment_machinery' then 'farm_equipment'
  when category in ('animal_health', 'animal_health_products') then 'feed_inputs'
  when category = 'services' then 'agri_services'
  when category = 'other_agricultural_products' then 'infrastructure'
  when category = 'all' then 'livestock'
  else category
end;

alter table public.buyer_requests
drop constraint if exists buyer_requests_category_check;

alter table public.buyer_requests
add constraint buyer_requests_category_check
check (category in (
  'livestock',
  'livestock_herds',
  'feed_inputs',
  'crops_produce',
  'farm_equipment',
  'vehicles',
  'infrastructure',
  'agri_services'
));

create table if not exists public.marketplace_categories (
  slug text primary key,
  label text not null,
  active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_subcategories (
  slug text not null,
  category_slug text not null references public.marketplace_categories(slug) on delete cascade,
  label text not null,
  active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  primary key (category_slug, slug)
);

alter table public.marketplace_categories enable row level security;
alter table public.marketplace_subcategories enable row level security;

drop policy if exists "Public read marketplace categories" on public.marketplace_categories;
create policy "Public read marketplace categories"
on public.marketplace_categories for select using (active = true or public.is_platform_admin());

drop policy if exists "Admins manage marketplace categories" on public.marketplace_categories;
create policy "Admins manage marketplace categories"
on public.marketplace_categories for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Public read marketplace subcategories" on public.marketplace_subcategories;
create policy "Public read marketplace subcategories"
on public.marketplace_subcategories for select using (active = true or public.is_platform_admin());

drop policy if exists "Admins manage marketplace subcategories" on public.marketplace_subcategories;
create policy "Admins manage marketplace subcategories"
on public.marketplace_subcategories for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

insert into public.marketplace_categories (slug, label, active, seo_title, seo_description)
values
  ('livestock', 'Livestock', true, 'Livestock for Sale in South Africa', 'Buy and sell cattle, goats, sheep, poultry and other livestock.'),
  ('livestock_herds', 'Livestock Herds', true, 'Livestock Herds for Sale', 'Find herd lots, breeding groups and dispersal sales.'),
  ('feed_inputs', 'Feed & Inputs', true, 'Feed and Farm Inputs', 'Shop feed, supplements, seed, fertilizer and animal health inputs.'),
  ('crops_produce', 'Crops / Produce', true, 'Crops and Farm Produce', 'Buy and sell grain, vegetables, eggs, dairy, honey and produce.'),
  ('farm_equipment', 'Farm Equipment', true, 'Farm Equipment and Machinery', 'Find tractors, implements, tools and processing equipment.'),
  ('vehicles', 'Vehicles', true, 'Farm Vehicles for Sale', 'Browse bakkies, trucks, trailers and livestock transport vehicles.'),
  ('infrastructure', 'Infrastructure', true, 'Farm Infrastructure', 'Shop irrigation, tanks, fencing, solar, greenhouses and sheds.'),
  ('agri_services', 'Agri Services', true, 'Agricultural Services', 'Find veterinary, transport, farm labour, consulting and mechanisation services.')
on conflict (slug) do update
set label = excluded.label,
    active = excluded.active,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;

insert into public.marketplace_subcategories (category_slug, slug, label, active)
values
  ('livestock', 'cattle', 'Cattle', true),
  ('livestock', 'goats', 'Goats', true),
  ('livestock', 'sheep', 'Sheep', true),
  ('livestock', 'poultry', 'Poultry', true),
  ('livestock', 'pigs', 'Pigs', true),
  ('livestock', 'rabbits', 'Rabbits', true),
  ('livestock', 'horses', 'Horses', true),
  ('livestock', 'other_livestock', 'Other Livestock', true),
  ('livestock', 'game_animals', 'Game Animals', true),
  ('livestock', 'bees_honey', 'Bees & Honey', true),
  ('livestock', 'fish_farming', 'Fish Farming', true),
  ('livestock', 'genetics_breeding_stock', 'Genetics & Breeding Stock', true),
  ('livestock_herds', 'breeding_herds', 'Breeding Herds', true),
  ('livestock_herds', 'commercial_herds', 'Commercial Herds', true),
  ('livestock_herds', 'stud_herds', 'Stud Herds', true),
  ('livestock_herds', 'cattle_herds', 'Cattle Herds', true),
  ('livestock_herds', 'goat_herds', 'Goat Herds', true),
  ('livestock_herds', 'sheep_flocks', 'Sheep Flocks', true),
  ('livestock_herds', 'mixed_herds', 'Mixed Herds', true),
  ('livestock_herds', 'dispersal_sales', 'Dispersal Sales', true),
  ('feed_inputs', 'livestock_feed', 'Livestock Feed', true),
  ('feed_inputs', 'lucerne', 'Lucerne', true),
  ('feed_inputs', 'hay', 'Hay', true),
  ('feed_inputs', 'maize', 'Maize', true),
  ('feed_inputs', 'pellets', 'Pellets', true),
  ('feed_inputs', 'feed_supplements', 'Feed Supplements', true),
  ('feed_inputs', 'animal_health_medication', 'Animal Health & Medication', true),
  ('feed_inputs', 'fertilizers', 'Fertilizers', true),
  ('feed_inputs', 'seeds_seedlings', 'Seeds & Seedlings', true),
  ('crops_produce', 'grain_maize', 'Grain & Maize', true),
  ('crops_produce', 'vegetables', 'Vegetables', true),
  ('crops_produce', 'fruit', 'Fruit', true),
  ('crops_produce', 'lucerne', 'Lucerne', true),
  ('crops_produce', 'maize', 'Maize', true),
  ('crops_produce', 'eggs', 'Eggs', true),
  ('crops_produce', 'dairy', 'Dairy', true),
  ('crops_produce', 'honey', 'Honey', true),
  ('crops_produce', 'fresh_produce', 'Fresh Produce', true),
  ('farm_equipment', 'tractors', 'Tractors', true),
  ('farm_equipment', 'implements', 'Implements', true),
  ('farm_equipment', 'ploughs', 'Ploughs', true),
  ('farm_equipment', 'balers', 'Balers', true),
  ('farm_equipment', 'harvesters', 'Harvesters', true),
  ('farm_equipment', 'sprayers', 'Sprayers', true),
  ('farm_equipment', 'irrigation_equipment', 'Irrigation Equipment', true),
  ('farm_equipment', 'feed_mixers', 'Feed Mixers', true),
  ('farm_equipment', 'dairy_equipment', 'Dairy Equipment', true),
  ('farm_equipment', 'milking_systems', 'Milking Systems', true),
  ('farm_equipment', 'processing_equipment', 'Processing Equipment', true),
  ('farm_equipment', 'packaging_equipment', 'Packaging Equipment', true),
  ('farm_equipment', 'workshop_tools', 'Workshop Tools', true),
  ('farm_equipment', 'gps_equipment', 'GPS Equipment', true),
  ('farm_equipment', 'monitoring_devices', 'Monitoring Devices', true),
  ('vehicles', 'cars', 'Cars', true),
  ('vehicles', 'bakkies', 'Bakkies', true),
  ('vehicles', 'trucks', 'Trucks', true),
  ('vehicles', 'trailers', 'Trailers', true),
  ('vehicles', 'motorcycles', 'Motorcycles', true),
  ('vehicles', 'livestock_trailers', 'Livestock Trailers', true),
  ('vehicles', 'utility_vehicles', 'Utility Vehicles', true),
  ('infrastructure', 'irrigation_systems', 'Irrigation Systems', true),
  ('infrastructure', 'water_tanks', 'Water Tanks', true),
  ('infrastructure', 'boreholes', 'Boreholes', true),
  ('infrastructure', 'fencing', 'Fencing', true),
  ('infrastructure', 'kraals', 'Kraals', true),
  ('infrastructure', 'solar_energy', 'Solar & Energy', true),
  ('infrastructure', 'storage_silos', 'Storage & Silos', true),
  ('infrastructure', 'storage', 'Storage', true),
  ('infrastructure', 'tunnels', 'Tunnels', true),
  ('infrastructure', 'greenhouses', 'Greenhouses', true),
  ('infrastructure', 'farm_buildings', 'Farm Buildings', true),
  ('infrastructure', 'cattle_crushes', 'Cattle Crushes', true),
  ('agri_services', 'transport', 'Transport', true),
  ('agri_services', 'veterinary', 'Veterinary', true),
  ('agri_services', 'breeding_services', 'Breeding Services', true),
  ('agri_services', 'shearing', 'Shearing', true),
  ('agri_services', 'farm_labour', 'Farm Labour', true),
  ('agri_services', 'consulting', 'Consulting', true),
  ('agri_services', 'mechanisation_services', 'Mechanisation Services', true),
  ('agri_services', 'equipment_hire', 'Equipment Hire', true),
  ('agri_services', 'farm_software', 'Farm Software', true),
  ('agri_services', 'precision_farming', 'Precision Farming', true),
  ('agri_services', 'auctions_dispersal_sales', 'Auctions & Dispersal Sales', true),
  ('agri_services', 'farms_for_sale', 'Farms for Sale', true),
  ('agri_services', 'farms_for_rent', 'Farms for Rent', true),
  ('agri_services', 'agricultural_property', 'Agricultural Property', true)
on conflict (category_slug, slug) do update
set label = excluded.label,
    active = excluded.active;
