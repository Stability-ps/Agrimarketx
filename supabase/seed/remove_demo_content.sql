-- Remove AgriMarketX development/demo content created by demo_content.sql.
-- This only removes rows marked with [DEMO], DEMO-* identifiers, or demo Unsplash media URLs.

begin;

delete from public.marketplace_listing_media
where storage_path like 'https://images.unsplash.com/%'
  and listing_id in (select id from public.marketplace_listings where title like '[DEMO]%');

delete from public.buyer_request_media
where storage_path like 'https://images.unsplash.com/%'
  and request_id in (select id from public.buyer_requests where title like '[DEMO]%');

delete from public.conversation_messages cm
where cm.conversation_id in (select c.id from public.conversations c where c.subject like '[DEMO]%')
   or cm.body like '[DEMO]%';

delete from public.conversation_participants cp
where cp.conversation_id in (select c.id from public.conversations c where c.subject like '[DEMO]%');

delete from public.conversations
where subject like '[DEMO]%';

delete from public.app_notifications
where title like '[DEMO]%';

delete from public.support_tickets
where subject like '[DEMO]%'
   or ticket_number like 'DEMO-%';

delete from public.disputes
where summary like '[DEMO]%';

delete from public.marketplace_enquiries
where message like '[DEMO]%';

delete from public.marketplace_offers
where message like '[DEMO]%';

delete from public.marketplace_saved_listings msl
where msl.listing_id in (select ml.id from public.marketplace_listings ml where ml.title like '[DEMO]%');

delete from public.buyer_request_responses brr
where brr.request_id in (select br.id from public.buyer_requests br where br.title like '[DEMO]%')
   or brr.message like '[DEMO]%';

delete from public.buyer_requests
where title like '[DEMO]%';

delete from public.ownership_history oh
where oh.animal_id in (select a.id from public.animals a where a.animal_code like 'DEMO-%');

delete from public.ownership_transfers ot
where ot.animal_id in (select a.id from public.animals a where a.animal_code like 'DEMO-%');

delete from public.marketplace_listings
where title like '[DEMO]%';

delete from public.finance_transactions
where description like '[DEMO]%';

delete from public.product_inventory
where batch_number like '%DEMO%';

delete from public.breeding_records
where notes like '[DEMO]%';

delete from public.birth_records
where notes like '[DEMO]%';

delete from public.health_records
where notes like '[DEMO]%';

delete from public.weight_records
where notes like '[DEMO]%';

delete from public.animal_documents
where title like '[DEMO]%';

delete from public.animal_media
where caption like '[DEMO]%';

delete from public.animals
where animal_code like 'DEMO-%';

delete from public.herds
where name like '[DEMO]%';

delete from public.camps
where name like '[DEMO]%';

delete from public.farm_followers ff
where ff.farm_id in (select f.id from public.farms f where f.name like '[DEMO]%');

delete from public.farm_species fs
where fs.farm_id in (select f.id from public.farms f where f.name like '[DEMO]%');

delete from public.farm_members fm
where fm.farm_id in (select f.id from public.farms f where f.name like '[DEMO]%');

delete from public.farms
where name like '[DEMO]%';

delete from public.subscriptions
where company_id = '10000000-0000-4000-8000-000000000001';

delete from public.companies
where id = '10000000-0000-4000-8000-000000000001';

commit;
