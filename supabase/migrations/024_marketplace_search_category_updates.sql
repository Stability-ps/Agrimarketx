update public.marketplace_listings
set subcategory = 'lucerne'
where subcategory = 'lucerne_hay';

update public.marketplace_listings
set subcategory = 'cars'
where category = 'vehicles'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like any (array['%car%', '%vehicle%']);

update public.marketplace_listings
set subcategory = 'bakkies'
where category = 'vehicles'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like any (array['%bakkie%', '%hilux%', '%gd6%']);

update public.marketplace_listings
set subcategory = 'livestock_trailers'
where category = 'vehicles'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like any (array['%livestock trailer%', '%stock trailer%']);

update public.marketplace_listings
set subcategory = 'trailers'
where category = 'vehicles'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like '%trailer%';

update public.marketplace_listings
set subcategory = 'tractors'
where category = 'farm_equipment'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like '%tractor%';

update public.marketplace_listings
set subcategory = 'feed_mixers'
where category = 'farm_equipment'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like any (array['%feed mixer%', '%mixer%']);

update public.marketplace_listings
set subcategory = 'lucerne'
where category = 'feed_inputs'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like any (array['%lucerne%', '%hay%']);

update public.marketplace_listings
set subcategory = 'eggs'
where category = 'crops_produce'
  and (subcategory is null or subcategory = '')
  and lower(coalesce(title, '')) like '%egg%';

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
