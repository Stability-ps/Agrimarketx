-- AgriMarketX development/demo content.
-- Safe to rerun. Demo rows are marked with [DEMO] titles/subjects and fixed UUIDs.
-- Requirement: at least one Supabase Auth user/profile must already exist.

begin;

insert into public.species (name, young_name, adult_female_name, adult_male_name, adult_age_threshold_months, gestation_period_days, default_breeding_terms, is_default)
values
  ('Cattle', 'Calf', 'Cow', 'Bull', 24, 283, 'Natural mating or AI, pregnancy check after 45-60 days.', true),
  ('Goats', 'Kid', 'Doe', 'Buck', 12, 150, 'Controlled exposure for 35-45 days, scan after 45 days.', true),
  ('Sheep', 'Lamb', 'Ewe', 'Ram', 12, 147, 'Ram exposure for 34-42 days, lambing records required.', true),
  ('Poultry', 'Chick', 'Hen', 'Rooster', 5, 21, 'Track hatch dates, laying cycles and vaccination dates.', true),
  ('Pigs', 'Piglet', 'Sow', 'Boar', 8, 114, 'Track service date, farrowing date and weaning.', true),
  ('Horses', 'Foal', 'Mare', 'Stallion', 36, 340, 'Record covering date, scans and foaling records.', true),
  ('Rabbits', 'Kit', 'Doe', 'Buck', 4, 31, 'Track mating date, kindle date and litter size.', true),
  ('Bees', 'Brood', 'Queen', 'Drone', 1, null, 'Track hive inspections and honey harvests.', true)
on conflict (name) do update
set young_name = excluded.young_name,
    adult_female_name = excluded.adult_female_name,
    adult_male_name = excluded.adult_male_name,
    adult_age_threshold_months = excluded.adult_age_threshold_months,
    gestation_period_days = excluded.gestation_period_days,
    default_breeding_terms = excluded.default_breeding_terms,
    is_default = excluded.is_default;

do $$
declare
  demo_owner uuid;
  demo_company uuid := '10000000-0000-4000-8000-000000000001';
  demo_admin uuid;
  rec record;
  listing_id uuid;
  farm_id uuid;
  animal_id uuid;
begin
  select id into demo_owner
  from public.profiles
  order by case account_role when 'super_admin' then 1 when 'admin' then 2 when 'seller' then 3 else 4 end, created_at
  limit 1;

  if demo_owner is null then
    raise exception 'AgriMarketX demo seed needs at least one existing user profile. Sign up once, then rerun this file.';
  end if;

  demo_admin := demo_owner;

  update public.profiles
  set account_role = case when account_role in ('admin', 'super_admin') then account_role else 'seller' end,
      account_type_selected = true,
      full_name = coalesce(full_name, 'Demo Platform User'),
      phone = coalesce(phone, '+27 72 000 1000'),
      whatsapp_number = coalesce(whatsapp_number, '+27 72 000 1000')
  where id = demo_owner;

  delete from public.marketplace_listing_media where storage_path like 'https://images.unsplash.com/%';
  delete from public.buyer_request_media where storage_path like 'https://images.unsplash.com/%';
  delete from public.conversation_messages where body like '[DEMO]%';
  delete from public.conversation_participants where conversation_id in (select id from public.conversations where subject like '[DEMO]%');
  delete from public.conversations where subject like '[DEMO]%';
  delete from public.app_notifications where title like '[DEMO]%';
  delete from public.support_tickets where subject like '[DEMO]%';
  delete from public.disputes where summary like '[DEMO]%';
  delete from public.marketplace_enquiries where message like '[DEMO]%';
  delete from public.marketplace_offers where message like '[DEMO]%';
  delete from public.marketplace_saved_listings where listing_id in (select id from public.marketplace_listings where title like '[DEMO]%');
  delete from public.buyer_request_responses where request_id in (select id from public.buyer_requests where title like '[DEMO]%');
  delete from public.buyer_requests where title like '[DEMO]%';
  delete from public.ownership_history where animal_id in (select id from public.animals where animal_code like 'DEMO-%');
  delete from public.ownership_transfers where animal_id in (select id from public.animals where animal_code like 'DEMO-%');
  delete from public.marketplace_listings where title like '[DEMO]%';
  delete from public.finance_transactions where description like '[DEMO]%';
  delete from public.product_inventory where batch_number like '%DEMO%';
  delete from public.breeding_records where notes like '[DEMO]%';
  delete from public.birth_records where notes like '[DEMO]%';
  delete from public.health_records where notes like '[DEMO]%';
  delete from public.weight_records where notes like '[DEMO]%';
  delete from public.animal_documents where title like '[DEMO]%';
  delete from public.animal_media where caption like '[DEMO]%';
  delete from public.animals where animal_code like 'DEMO-%';
  delete from public.herds where name like '[DEMO]%';
  delete from public.camps where name like '[DEMO]%';
  delete from public.farm_followers where farm_id in (select id from public.farms where name like '[DEMO]%');
  delete from public.farm_species where farm_id in (select id from public.farms where name like '[DEMO]%');
  delete from public.farm_members where farm_id in (select id from public.farms where name like '[DEMO]%');
  delete from public.farms where name like '[DEMO]%';
  delete from public.subscriptions where company_id = demo_company;
  delete from public.companies where id = demo_company;

  insert into public.companies (id, name, owner_id, country)
  values (demo_company, '[DEMO] AgriMarketX Demo Holdings', demo_owner, 'South Africa')
  on conflict (id) do update set name = excluded.name, owner_id = excluded.owner_id, country = excluded.country;

  for rec in
    select * from (values
      ('20000000-0000-4000-8000-000000000001'::uuid, '[DEMO] Moopane Boer Goat Stud', 'Thabo Mokoena', '+27 82 555 0141', 'Polokwane', 'Limpopo', 'Polokwane', 'Stud livestock and mixed farming', array['livestock','livestock_herds','feed_inputs'], 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=900&q=80'),
      ('20000000-0000-4000-8000-000000000002'::uuid, '[DEMO] Greenfields Produce Farm', 'Naledi Jacobs', '+27 83 555 0188', 'Standerton', 'Mpumalanga', 'Standerton', 'Grain, maize and seasonal produce', array['crops_produce','feed_inputs','agri_services'], 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'),
      ('20000000-0000-4000-8000-000000000003'::uuid, '[DEMO] Lekazi Equipment & Implements', 'Sibusiso Dlamini', '+27 71 555 0124', 'Pretoria', 'Gauteng', 'Pretoria', 'Equipment dealer and farm services', array['farm_equipment','vehicles','infrastructure','agri_services'], 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80'),
      ('20000000-0000-4000-8000-000000000004'::uuid, '[DEMO] Karoo Sheep Collective', 'Anika Botha', '+27 72 555 0150', 'Beaufort West', 'Western Cape', 'Central Karoo', 'Dorper sheep, wool and livestock transport', array['livestock','livestock_herds','agri_services'], 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=80'),
      ('20000000-0000-4000-8000-000000000005'::uuid, '[DEMO] Free State Feed Depot', 'Mpho Radebe', '+27 79 555 0166', 'Bethlehem', 'Free State', 'Bethlehem', 'Feed, lucerne, pellets and supplements', array['feed_inputs','crops_produce'], 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80'),
      ('20000000-0000-4000-8000-000000000006'::uuid, '[DEMO] KZN Agri Services', 'Priya Naidoo', '+27 84 555 0199', 'Pietermaritzburg', 'KwaZulu-Natal', 'Pietermaritzburg', 'Veterinary, transport and mechanisation services', array['agri_services','vehicles','farm_equipment'], 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80')
    ) as v(id, name, owner_name, owner_phone, town, province, location, farm_type, supply_categories, photo_url)
  loop
    insert into public.farms (
      id, company_id, name, owner_name, owner_phone, location, province, country, size_hectares,
      farm_type, facilities, is_verified, description, photo_url, logo_url, seller_verification_status,
      seller_verification_submitted_at, seller_verified_at, supply_categories
    )
    values (
      rec.id, demo_company, rec.name, rec.owner_name, rec.owner_phone, rec.location, rec.province, 'South Africa', 420,
      rec.farm_type, array['Loading ramp','Water points','Handling facilities','Secure storage'], true,
      rec.farm_type || '. Demo profile for testing AgriMarketX marketplace, farm pages and seller trust.', rec.photo_url,
      rec.photo_url, 'verified', now() - interval '30 days', now() - interval '25 days', rec.supply_categories
    )
    on conflict (id) do update
    set name = excluded.name,
        owner_name = excluded.owner_name,
        owner_phone = excluded.owner_phone,
        location = excluded.location,
        province = excluded.province,
        description = excluded.description,
        photo_url = excluded.photo_url,
        logo_url = excluded.logo_url,
        seller_verification_status = excluded.seller_verification_status,
        supply_categories = excluded.supply_categories;

    insert into public.farm_members (farm_id, user_id, role, invited_by)
    values (rec.id, demo_owner, 'owner', demo_owner)
    on conflict (farm_id, user_id) do update set role = excluded.role;
  end loop;

  insert into public.locations (province, town, slug, created_by, usage_count)
  values
    ('Limpopo','Polokwane','polokwane',demo_owner,12),
    ('Limpopo','Tzaneen','tzaneen',demo_owner,8),
    ('Gauteng','Pretoria','pretoria',demo_owner,18),
    ('Gauteng','Johannesburg','johannesburg',demo_owner,14),
    ('Mpumalanga','Nelspruit','nelspruit',demo_owner,9),
    ('Mpumalanga','Standerton','standerton',demo_owner,5),
    ('Western Cape','Beaufort West','beaufort-west',demo_owner,4),
    ('Free State','Bethlehem','bethlehem',demo_owner,7),
    ('KwaZulu-Natal','Pietermaritzburg','pietermaritzburg',demo_owner,6),
    ('Eastern Cape','Gqeberha','gqeberha',demo_owner,6),
    ('North West','Vryburg','vryburg',demo_owner,6),
    ('Northern Cape','Kimberley','kimberley',demo_owner,6)
  on conflict (province, town) do update set usage_count = greatest(public.locations.usage_count, excluded.usage_count);

  insert into public.farm_species (farm_id, species_id)
  select f.id, s.id
  from public.farms f
  cross join public.species s
  where f.name like '[DEMO]%'
    and s.name in ('Cattle','Goats','Sheep','Poultry','Pigs','Horses')
  on conflict (farm_id, species_id) do nothing;

  insert into public.camps (id, farm_id, name, section_name, size_hectares, notes)
  values
    ('21000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','[DEMO] North Breeding Camp','A Section',48,'[DEMO] Breeding animals and kidding checks.'),
    ('21000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','[DEMO] Karoo Lambing Camp','Windmill Section',120,'[DEMO] Dorper lambing area.'),
    ('21000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002','[DEMO] Feed Trial Field','Maize Block',80,'[DEMO] Crop and feed trial block.')
  on conflict (id) do update set name = excluded.name, notes = excluded.notes;

  insert into public.herds (id, farm_id, camp_id, name, species_id, purpose)
  select '22000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, '21000000-0000-4000-8000-000000000001'::uuid, '[DEMO] Boer Goat Breeding Group', id, 'Stud breeding'
  from public.species where name = 'Goats'
  on conflict (id) do update set name = excluded.name, purpose = excluded.purpose;

  insert into public.herds (id, farm_id, camp_id, name, species_id, purpose)
  select '22000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, '21000000-0000-4000-8000-000000000002'::uuid, '[DEMO] Dorper Ewe Flock', id, 'Commercial lamb production'
  from public.species where name = 'Sheep'
  on conflict (id) do update set name = excluded.name, purpose = excluded.purpose;

  for rec in
    select * from (values
      ('40000000-0000-4000-8000-000000000001'::uuid,'20000000-0000-4000-8000-000000000001'::uuid,'22000000-0000-4000-8000-000000000001'::uuid,'Goats','DEMO-GOAT-001','PAS-DEMO-GOAT-001','25811','Boer','female'::public.gender,'2024-08-14'::date,'young',48,'alive'::public.animal_status,'bred_on_farm'::public.animal_origin,'Strong young Boer doe with complete vaccination record.'),
      ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Goats','DEMO-GOAT-002','PAS-DEMO-GOAT-002','25812','Boer','male','2023-11-20','adult',82,'to_be_sold','bred_on_farm','Proven Boer buck, calm temperament.'),
      ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','22000000-0000-4000-8000-000000000002','Sheep','DEMO-SHEEP-001','PAS-DEMO-SHEEP-001','DOR-044','Dorper','female','2023-06-08','adult',67,'alive','bred_on_farm','Commercial Dorper ewe.'),
      ('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','22000000-0000-4000-8000-000000000002','Sheep','DEMO-SHEEP-002','PAS-DEMO-SHEEP-002','DOR-055','Dorper','male','2022-09-11','adult',91,'to_be_sold','purchased','Wide-framed Dorper ram.'),
      ('40000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001',null,'Cattle','DEMO-CATTLE-001','PAS-DEMO-CATTLE-001','BON-018','Bonsmara','male','2022-02-01','adult',610,'to_be_sold','purchased','Bonsmara bull with good growth history.'),
      ('40000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000006',null,'Horses','DEMO-HORSE-001','PAS-DEMO-HORSE-001','HR-09','Boerperd','female','2021-04-17','adult',410,'alive','purchased','Farm mare used for stock work.')
    ) as v(id, farm_id, herd_id, species_name, animal_code, passport_id, tag_number, breed, gender, dob, age_category, weight, status, origin, notes)
  loop
    insert into public.animals (
      id, farm_id, herd_id, species_id, animal_code, passport_id, qr_code_payload, tag_number,
      breed, gender, date_of_birth, age_category, current_weight_kg, status, origin,
      public_passport_enabled, notes, created_by
    )
    select rec.id, rec.farm_id, rec.herd_id, s.id, rec.animal_code, rec.passport_id,
      'https://agrimarketx.co.za/passport/' || rec.passport_id, rec.tag_number,
      rec.breed, rec.gender, rec.dob, rec.age_category, rec.weight, rec.status, rec.origin,
      true, '[DEMO] ' || rec.notes, demo_owner
    from public.species s where s.name = rec.species_name
    on conflict (id) do update
    set current_weight_kg = excluded.current_weight_kg,
        status = excluded.status,
        notes = excluded.notes;

    insert into public.weight_records (animal_id, weight_kg, measured_at, notes, created_by)
    values (rec.id, rec.weight, current_date - 14, '[DEMO] Latest development weight record.', demo_owner);
  end loop;

  insert into public.animal_media (animal_id, media_type, storage_path, caption)
  values
    ('40000000-0000-4000-8000-000000000001','photo','https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=900&q=80','[DEMO] Boer doe profile photo'),
    ('40000000-0000-4000-8000-000000000002','photo','https://images.unsplash.com/photo-1551298457-c72eced6d0d1?auto=format&fit=crop&w=900&q=80','[DEMO] Boer buck profile photo'),
    ('40000000-0000-4000-8000-000000000003','photo','https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=80','[DEMO] Dorper ewe photo'),
    ('40000000-0000-4000-8000-000000000005','photo','https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80','[DEMO] Bonsmara bull photo');

  insert into public.product_inventory (farm_id, name, category, batch_number, quantity, unit, expiry_date, withdrawal_period_days)
  values
    ('20000000-0000-4000-8000-000000000001','Multivax P Plus','vaccine','MVX-DEMO-24',18,'doses',current_date + 220,21),
    ('20000000-0000-4000-8000-000000000001','Dewormer oral solution','deworming','DWM-DEMO-11',12,'litres',current_date + 160,14),
    ('20000000-0000-4000-8000-000000000005','Lucerne pellets 40kg','feed','LUC-DEMO-40',360,'bags',current_date + 365,null);

  insert into public.health_records (farm_id, animal_id, herd_id, record_type, product_name, batch_number, dosage, withdrawal_period_days, administered_at, due_at, notes, created_by)
  values
    ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',null,'vaccination','Multivax P Plus','MVX-DEMO-24','2 ml',21,current_date - 20,current_date + 160,'[DEMO] Vaccination due reminder test.',demo_owner),
    ('20000000-0000-4000-8000-000000000001',null,'22000000-0000-4000-8000-000000000001','deworming','Oral dewormer','DWM-DEMO-11','10 ml per 50kg',14,current_date - 30,current_date + 60,'[DEMO] Herd deworming record.',demo_owner),
    ('20000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000003',null,'treatment','Wound spray','WND-DEMO-07','Topical',0,current_date - 5,current_date + 7,'[DEMO] Treatment follow-up.',demo_owner);

  insert into public.breeding_records (farm_id, female_animal_id, male_animal_id, record_type, event_date, pregnancy_status, expected_birth_date, notes, created_by)
  values
    ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','mating',current_date - 45,'pending',current_date + 105,'[DEMO] Boer goat breeding exposure.',demo_owner),
    ('20000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004','pregnancy_check',current_date - 12,'positive',current_date + 80,'[DEMO] Dorper ewe confirmed pregnant.',demo_owner);

  insert into public.finance_transactions (farm_id, animal_id, transaction_type, amount, currency, description, invoice_number, paid_at, due_at, created_by)
  values
    ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','valuation',12500,'ZAR','[DEMO] Boer buck herd valuation','DEMO-VAL-001',current_date - 7,null,demo_owner),
    ('20000000-0000-4000-8000-000000000005',null,'feed_purchase',48500,'ZAR','[DEMO] Bulk lucerne inventory purchase','DEMO-FEED-001',current_date - 10,null,demo_owner),
    ('20000000-0000-4000-8000-000000000006',null,'transport_cost',3200,'ZAR','[DEMO] Livestock delivery route cost','DEMO-TRN-001',null,current_date + 14,demo_owner);

  for rec in
    select * from (values
      ('30000000-0000-4000-8000-000000000001'::uuid,'20000000-0000-4000-8000-000000000001'::uuid,'40000000-0000-4000-8000-000000000002'::uuid,'[DEMO] Boer Goat Ram - Proven Breeder','Strong Boer ram with complete health records and quiet handling temperament.',12500,'Limpopo','Polokwane','Near Polokwane, Limpopo',true,'livestock','goats','{"Age":"2 years","Weight":"82kg","Gender":"Male","Breed":"Boer"}'::jsonb,'https://images.unsplash.com/photo-1551298457-c72eced6d0d1?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',null,'[DEMO] 30 Boer Goats Breeding Herd','Mixed Boer breeding herd with does, young does and two working bucks.',165000,'Limpopo','Polokwane','Near Polokwane, Limpopo',true,'livestock_herds','goat_herds','{"Breakdown":"24 does, 2 bucks, 4 young does","Per Head":"R5 500","Age":"Mixed ages"}','https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000004','[DEMO] Dorper Ram Ready for Work','Wide-framed Dorper ram from a hardy Karoo flock.',8500,'Western Cape','Beaufort West','Near Beaufort West, Western Cape',true,'livestock','sheep','{"Age":"3 years","Weight":"91kg","Gender":"Male","Breed":"Dorper"}','https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000005','[DEMO] Bonsmara Bull','Bonsmara bull with good weight history and calm handling.',52000,'Limpopo','Polokwane','Near Polokwane, Limpopo',false,'livestock','cattle','{"Age":"4 years","Weight":"610kg","Gender":"Male","Breed":"Bonsmara"}','https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005',null,'[DEMO] 40kg Lucerne Pellets','High-protein lucerne pellets suitable for goats, sheep and cattle.',195,'Free State','Bethlehem','Near Bethlehem, Free State',true,'feed_inputs','lucerne','{"Bag Size":"40kg","Quantity":"360 bags","Protein":"18%"}','https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000005',null,'[DEMO] Goat Feed Grower Pellets','Balanced grower pellets for young goats and sheep.',265,'Free State','Bethlehem','Near Bethlehem, Free State',true,'feed_inputs','livestock_feed','{"Bag Size":"50kg","Quantity":"220 bags","Stock":"In stock"}','https://images.unsplash.com/photo-1599733757340-92cde83c470e?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000002',null,'[DEMO] Yellow Maize - Grade A','Clean yellow maize available in bulk loads.',3200,'Mpumalanga','Standerton','Near Standerton, Mpumalanga',true,'crops_produce','grain_maize','{"Grade":"A","Quantity":"25 tons","Delivery":"Available"}','https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000002',null,'[DEMO] Fresh Free Range Eggs','Weekly supply of free range eggs packed in trays.',85,'Mpumalanga','Standerton','Near Standerton, Mpumalanga',false,'crops_produce','eggs','{"Packaging":"30 egg tray","Quantity":"80 trays/week","Delivery":"Local"}','https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000003',null,'[DEMO] John Deere 6120M Tractor','Clean tractor with service records. Ready for row crop and baling work.',650000,'Gauteng','Pretoria','Near Pretoria, Gauteng',true,'farm_equipment','tractors','{"Year/Model":"2021 John Deere 6120M","Hours":"1 350 hrs","Power":"120 HP"}','https://images.unsplash.com/photo-1605338198618-d6c2fda7d7ec?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000003',null,'[DEMO] Hammer Mill with Electric Motor','Working hammer mill for feed preparation.',18500,'Gauteng','Pretoria','Near Pretoria, Gauteng',true,'farm_equipment','feed_mixers','{"Condition":"Good","Motor":"7.5kW","Use":"Feed milling"}','https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000003',null,'[DEMO] Toyota Hilux Farm Bakkie','Reliable farm bakkie with canopy and tow bar.',285000,'Gauteng','Pretoria','Near Pretoria, Gauteng',true,'vehicles','bakkies','{"Year":"2020","Mileage":"98 000km","Transmission":"Manual"}','https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000006',null,'[DEMO] Livestock Trailer','Double axle livestock trailer with loading ramp.',78000,'KwaZulu-Natal','Pietermaritzburg','Near Pietermaritzburg, KwaZulu-Natal',true,'vehicles','livestock_trailers','{"Condition":"Good","Axles":"Double axle","Capacity":"12 sheep / 8 goats"}','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000013','20000000-0000-4000-8000-000000000003',null,'[DEMO] Cattle Crush and Loading Ramp','Heavy-duty crush system with neck clamp and loading gate.',45000,'Gauteng','Pretoria','Near Pretoria, Gauteng',true,'infrastructure','cattle_crushes','{"Size":"Heavy duty","Condition":"Excellent","Material":"Galvanised steel"}','https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000014','20000000-0000-4000-8000-000000000003',null,'[DEMO] 10 000L Water Tank','JoJo-style water tank suitable for farm water storage.',14500,'Gauteng','Pretoria','Near Pretoria, Gauteng',false,'infrastructure','water_tanks','{"Size":"10 000L","Condition":"New","Colour":"Green"}','https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000015','20000000-0000-4000-8000-000000000006',null,'[DEMO] Livestock Transport Service','Transport for goats, sheep and cattle across KZN and Gauteng.',450,'KwaZulu-Natal','Pietermaritzburg','Near Pietermaritzburg, KwaZulu-Natal',false,'agri_services','transport','{"Service":"Livestock transport","Coverage":"KZN, Gauteng, Free State","Rate":"From R450/km"}','https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000016','20000000-0000-4000-8000-000000000006',null,'[DEMO] Mobile Vet Farm Visits','Routine herd checks, vaccinations and treatment visits.',950,'KwaZulu-Natal','Pietermaritzburg','Near Pietermaritzburg, KwaZulu-Natal',false,'agri_services','veterinary','{"Service":"Vet visit","Availability":"Weekdays","Coverage":"Midlands"}','https://images.unsplash.com/photo-1576765607924-3f7b8410a787?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000017','20000000-0000-4000-8000-000000000002',null,'[DEMO] Raw Farm Honey 500ml','Raw local honey packed in 500ml glass jars.',65,'Mpumalanga','Nelspruit','Near Nelspruit, Mpumalanga',true,'crops_produce','honey','{"Packaging":"500ml jars","Quantity":"240 jars","Stock":"In stock"}','https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000018','20000000-0000-4000-8000-000000000003',null,'[DEMO] Irrigation Pivot System','Used pivot system, 450m span, suitable for maize lands.',250000,'Northern Cape','Kimberley','Near Kimberley, Northern Cape',true,'infrastructure','irrigation_systems','{"Size":"450m span","Condition":"Good","Includes":"Control panel"}','https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000019','20000000-0000-4000-8000-000000000003',null,'[DEMO] Dairy Milking System','Complete milking setup for a small dairy herd.',120000,'Eastern Cape','Gqeberha','Near Gqeberha, Eastern Cape',true,'farm_equipment','milking_systems','{"Condition":"Good","Capacity":"8 point","Includes":"Vacuum pump"}','https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000020','20000000-0000-4000-8000-000000000004',null,'[DEMO] Dorper Ewe Flock - 80 Head','Hardy Dorper ewe flock, veld adapted.',188000,'Western Cape','Beaufort West','Near Beaufort West, Western Cape',true,'livestock_herds','sheep_flocks','{"Breakdown":"80 ewes","Age":"2-5 years","Per Head":"R2 350"}','https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000005',null,'[DEMO] Fertilizer 2:3:2 50kg','Granular fertilizer available by bag or pallet.',420,'Free State','Bethlehem','Near Bethlehem, Free State',true,'feed_inputs','fertilizers','{"Bag Size":"50kg","Quantity":"180 bags","Stock":"Pallet lots"}','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000022','20000000-0000-4000-8000-000000000002',null,'[DEMO] Tomato Crates - Grade 1','Fresh tomatoes packed in reusable crates.',135,'Mpumalanga','Nelspruit','Near Nelspruit, Mpumalanga',true,'crops_produce','vegetables','{"Grade":"1","Quantity":"120 crates","Delivery":"Available"}','https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000023','20000000-0000-4000-8000-000000000006',null,'[DEMO] Ploughing Service Per Hectare','Mechanisation service for land prep and ploughing.',450,'KwaZulu-Natal','Pietermaritzburg','Near Pietermaritzburg, KwaZulu-Natal',false,'agri_services','mechanisation_services','{"Service":"Ploughing","Unit":"Per hectare","Availability":"Bookings open"}','https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=80'),
      ('30000000-0000-4000-8000-000000000024','20000000-0000-4000-8000-000000000003',null,'[DEMO] Farm Software Setup Service','Onboarding support for AgriMarketX farm records and marketplace setup.',1200,'Gauteng','Johannesburg','Near Johannesburg, Gauteng',false,'agri_services','farm_software','{"Service":"Software setup","Coverage":"Remote and Gauteng","Experience":"Farm operations"}','https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80')
    ) as v(id, farm_id, animal_id, title, description, price, province, town, approximate_location, price_negotiable, category, subcategory, details, image_url)
  loop
    insert into public.marketplace_listings (
      id, seller_farm_id, animal_id, title, description, price, currency, province, town, approximate_location,
      price_negotiable, category, subcategory, listing_details, status, views_count, contact_clicks_count,
      whatsapp_clicks_count, call_clicks_count, chat_clicks_count, share_clicks_count, similar_clicks_count,
      saved_count, seller_contact_name, seller_contact_phone, seller_contact_whatsapp, seller_contact_email,
      preferred_contact_method, expires_at, created_at
    )
    values (
      rec.id, rec.farm_id, rec.animal_id, rec.title, rec.description, rec.price, 'ZAR', rec.province, rec.town, rec.approximate_location,
      rec.price_negotiable, rec.category, rec.subcategory, rec.details, 'active', 8 + floor(random() * 180)::int, 1 + floor(random() * 28)::int,
      floor(random() * 12)::int, floor(random() * 10)::int, floor(random() * 16)::int, floor(random() * 12)::int, floor(random() * 8)::int,
      floor(random() * 18)::int, 'AgriMarketX Demo Seller', '+27 72 000 1000', '+27 72 000 1000',
      coalesce((select email from public.profiles where id = demo_owner), 'demo@agrimarketx.co.za'), 'whatsapp',
      current_date + 45, now() - (floor(random() * 20)::int || ' days')::interval
    )
    on conflict (id) do update
    set title = excluded.title,
        description = excluded.description,
        price = excluded.price,
        province = excluded.province,
        town = excluded.town,
        approximate_location = excluded.approximate_location,
        category = excluded.category,
        subcategory = excluded.subcategory,
        listing_details = excluded.listing_details,
        status = excluded.status,
        seller_contact_phone = excluded.seller_contact_phone;

    insert into public.marketplace_listing_media (listing_id, seller_farm_id, storage_path, media_type, is_primary)
    values (rec.id, rec.farm_id, rec.image_url, 'photo', true);
  end loop;

  insert into public.marketplace_saved_listings (listing_id, user_id)
  select id, demo_owner from public.marketplace_listings where title like '[DEMO]%' order by created_at desc limit 6
  on conflict (listing_id, user_id) do nothing;

  insert into public.farm_followers (farm_id, user_id)
  select id, demo_owner from public.farms where name like '[DEMO]%' limit 4
  on conflict (farm_id, user_id) do nothing;

  for rec in
    select * from (values
      ('50000000-0000-4000-8000-000000000001'::uuid,'livestock','goats','[DEMO] Looking for 20 Boer Does','Buyer needs young Boer does with vaccination history.', '20 does','R2 500 - R3 000 / head','Limpopo','Polokwane','Near Polokwane, Limpopo','urgent','2026-07-20'::date,'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=900&q=80'),
      ('50000000-0000-4000-8000-000000000002','feed_inputs','lucerne','[DEMO] Need Lucerne Bales','Looking for regular lucerne supply for goats and horses.', '100+ bales','Bulk price required','Free State','Bethlehem','Near Bethlehem, Free State','needed_soon','2026-08-01','https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80'),
      ('50000000-0000-4000-8000-000000000003','farm_equipment','tractors','[DEMO] Looking for 80-120HP Tractor','Buyer wants a clean tractor with service records.', '1 tractor','R350 000 - R650 000','Gauteng','Pretoria','Near Pretoria, Gauteng','flexible','2026-09-15','https://images.unsplash.com/photo-1605338198618-d6c2fda7d7ec?auto=format&fit=crop&w=900&q=80'),
      ('50000000-0000-4000-8000-000000000004','vehicles','bakkies','[DEMO] Need Farm Bakkie','Looking for diesel bakkie with canopy and tow bar.', '1 vehicle','R180 000 - R300 000','Mpumalanga','Nelspruit','Near Nelspruit, Mpumalanga','needed_soon','2026-08-20','https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80'),
      ('50000000-0000-4000-8000-000000000005','agri_services','transport','[DEMO] Livestock Transport Needed','Transport needed for 30 goats from Limpopo to Gauteng.', '30 goats','Quote requested','Gauteng','Johannesburg','Near Johannesburg, Gauteng','urgent','2026-07-10','https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&w=900&q=80')
    ) as v(id, category, subcategory, title, description, quantity, budget, province, town, approximate_location, urgency, needed_by, image_url)
  loop
    insert into public.buyer_requests (
      id, buyer_id, category, subcategory, title, description, province, town, approximate_location,
      quantity, budget, contact_preference, urgency, needed_by, status, reviewed_by, reviewed_at, admin_note
    )
    values (
      rec.id, demo_owner, rec.category, rec.subcategory, rec.title, rec.description, rec.province, rec.town, rec.approximate_location,
      rec.quantity, rec.budget, 'whatsapp', rec.urgency, rec.needed_by, 'published', demo_admin, now() - interval '2 days', '[DEMO] Published demo request.'
    )
    on conflict (id) do update
    set title = excluded.title,
        description = excluded.description,
        status = excluded.status;

    insert into public.buyer_request_media (request_id, storage_path, media_type, is_primary)
    values (rec.id, rec.image_url, 'photo', true);
  end loop;

  insert into public.buyer_request_responses (request_id, seller_farm_id, seller_user_id, message, quote_amount, available_quantity, delivery_option, contact_preference)
  values
    ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',demo_owner,'[DEMO] We can supply 18 young does now and 8 more next month.',54000,'18-26 does','Collection or delivery','whatsapp'),
    ('50000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003',demo_owner,'[DEMO] We have a clean 2021 120HP tractor available for inspection.',650000,'1 tractor','Inspection in Pretoria','call');

  insert into public.marketplace_enquiries (listing_id, seller_farm_id, buyer_user_id, buyer_name, buyer_phone, buyer_email, preferred_contact_method, message)
  values
    ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',demo_owner,'Demo Buyer','+27 73 000 2000','buyer.demo@agrimarketx.co.za','whatsapp','[DEMO] Is the Boer ram still available for inspection this weekend?'),
    ('30000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000003',demo_owner,'Demo Buyer','+27 73 000 2000','buyer.demo@agrimarketx.co.za','call','[DEMO] Please send service history for the Hilux.');

  insert into public.marketplace_offers (listing_id, buyer_id, amount, currency, status, message)
  values
    ('30000000-0000-4000-8000-000000000001', demo_owner, 11500, 'ZAR', 'pending', '[DEMO] Offer for Boer ram after viewing photos.'),
    ('30000000-0000-4000-8000-000000000009', demo_owner, 620000, 'ZAR', 'pending', '[DEMO] Offer subject to inspection and service records.');

  insert into public.disputes (listing_id, opened_by, status, summary, admin_notes)
  values
    ('30000000-0000-4000-8000-000000000012', demo_owner, 'open', '[DEMO] Buyer reported duplicate livestock trailer photos', '[DEMO] Admin should review image history.'),
    ('30000000-0000-4000-8000-000000000016', demo_owner, 'reviewing', '[DEMO] Service availability needs confirmation', '[DEMO] Asked seller to confirm operating area.');

  insert into public.support_tickets (id, ticket_number, created_by, farm_id, category, subject, description, priority, status, admin_note)
  values
    ('60000000-0000-4000-8000-000000000001','DEMO-SUP-001',demo_owner,'20000000-0000-4000-8000-000000000001','listing','[DEMO] Listing photo not showing','Demo ticket for testing support queue and admin response flow.','normal','open','[DEMO] Check listing media row.'),
    ('60000000-0000-4000-8000-000000000002','DEMO-SUP-002',demo_owner,'20000000-0000-4000-8000-000000000003','verification','[DEMO] Verification document question','Demo ticket for seller verification support.','high','in_progress','[DEMO] Waiting for uploaded ID.')
  on conflict (id) do update set subject = excluded.subject, status = excluded.status;

  insert into public.conversations (id, type, subject, listing_id, support_ticket_id, buyer_user_id, seller_farm_id, status, created_by)
  values
    ('70000000-0000-4000-8000-000000000001','marketplace','[DEMO] Chat about Boer Goat Ram','30000000-0000-4000-8000-000000000001',null,demo_owner,'20000000-0000-4000-8000-000000000001','open',demo_owner),
    ('70000000-0000-4000-8000-000000000002','support','[DEMO] Support: listing photo not showing',null,'60000000-0000-4000-8000-000000000001',demo_owner,'20000000-0000-4000-8000-000000000001','waiting',demo_owner)
  on conflict (id) do update set subject = excluded.subject, status = excluded.status;

  insert into public.conversation_participants (conversation_id, user_id, farm_id, role)
  values
    ('70000000-0000-4000-8000-000000000001',demo_owner,null,'buyer'),
    ('70000000-0000-4000-8000-000000000001',null,'20000000-0000-4000-8000-000000000001','seller'),
    ('70000000-0000-4000-8000-000000000002',demo_owner,null,'member'),
    ('70000000-0000-4000-8000-000000000002',null,'20000000-0000-4000-8000-000000000001','seller');

  insert into public.conversation_messages (conversation_id, sender_user_id, sender_farm_id, body)
  values
    ('70000000-0000-4000-8000-000000000001',demo_owner,null,'[DEMO] Hi, can I view the Boer ram on Saturday morning?'),
    ('70000000-0000-4000-8000-000000000001',null,'20000000-0000-4000-8000-000000000001','[DEMO] Yes, Saturday after 10:00 works. I will send the location after confirmation.'),
    ('70000000-0000-4000-8000-000000000002',demo_owner,null,'[DEMO] The image appeared on marketplace but not my listings.'),
    ('70000000-0000-4000-8000-000000000002',null,'20000000-0000-4000-8000-000000000001','[DEMO] Thanks, support is reviewing the media row.');

  insert into public.app_notifications (user_id, farm_id, title, body, type, link_url, read_at, created_at)
  values
    (demo_owner,null,'[DEMO] Listing approved','Your Boer Goat Ram listing is now live.','listing','/account/listings',null,now() - interval '2 hours'),
    (demo_owner,'20000000-0000-4000-8000-000000000001','[DEMO] New buyer message','A buyer asked about your Boer Goat Ram.','message','/account/messages',null,now() - interval '1 hour'),
    (demo_owner,'20000000-0000-4000-8000-000000000001','[DEMO] Vaccination due soon','Boer goat breeding group has a vaccine due date approaching.','health','/health',now(),now() - interval '1 day'),
    (demo_owner,null,'[DEMO] Seller verification approved','Your demo seller profile is verified.','verification','/account/verification',now(),now() - interval '3 days');

  insert into public.ownership_transfers (id, animal_id, seller_farm_id, buyer_user_id, status, delivery_method, seller_ready_at, in_transit_at, delivered_at)
  values
    ('80000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',demo_owner,'in_transit','delivery',now() - interval '3 days',now() - interval '1 day',null)
  on conflict (id) do update set status = excluded.status;

  insert into public.ownership_history (animal_id, farm_id, owner_user_id, acquired_at, transfer_id)
  values
    ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',demo_owner,now() - interval '2 years','80000000-0000-4000-8000-000000000001');

  insert into public.subscription_plans (name, animal_limit, feature_limits)
  values
    ('Starter', 100, '{"marketplaceListings":10,"farms":1}'::jsonb),
    ('Professional', 2000, '{"marketplaceListings":100,"farms":5}'::jsonb),
    ('Enterprise', null, '{"marketplaceListings":"unlimited","farms":"unlimited"}'::jsonb)
  on conflict (name) do update set animal_limit = excluded.animal_limit, feature_limits = excluded.feature_limits;

  insert into public.subscriptions (company_id, plan_id, billing_interval, status, current_period_end)
  select demo_company, id, 'monthly', 'active', now() + interval '30 days'
  from public.subscription_plans
  where name = 'Professional'
  on conflict do nothing;
end $$;

commit;
