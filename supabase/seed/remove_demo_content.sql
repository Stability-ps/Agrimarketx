-- Remove AgriMarketX development/demo content created by demo_content.sql.
-- This only removes rows marked with [DEMO], DEMO-* identifiers, or demo Unsplash media URLs.

begin;

delete from public.marketplace_listing_media
where storage_path like 'https://images.unsplash.com/%'
  and listing_id in (select id from public.marketplace_listings where title like '[DEMO]%');

delete from public.buyer_request_media
where storage_path like 'https://images.unsplash.com/%'
  and request_id in (select id from public.buyer_requests where title like '[DEMO]%');

delete from public.conversation_messages
where conversation_id in (select id from public.conversations where subject like '[DEMO]%')
   or body like '[DEMO]%';

delete from public.conversation_participants
where conversation_id in (select id from public.conversations where subject like '[DEMO]%');

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

delete from public.marketplace_saved_listings
where listing_id in (select id from public.marketplace_listings where title like '[DEMO]%');

delete from public.buyer_request_responses
where request_id in (select id from public.buyer_requests where title like '[DEMO]%')
   or message like '[DEMO]%';

delete from public.buyer_requests
where title like '[DEMO]%';

delete from public.ownership_history
where animal_id in (select id from public.animals where animal_code like 'DEMO-%');

delete from public.ownership_transfers
where animal_id in (select id from public.animals where animal_code like 'DEMO-%');

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

delete from public.farm_followers
where farm_id in (select id from public.farms where name like '[DEMO]%');

delete from public.farm_species
where farm_id in (select id from public.farms where name like '[DEMO]%');

delete from public.farm_members
where farm_id in (select id from public.farms where name like '[DEMO]%');

delete from public.farms
where name like '[DEMO]%';

delete from public.subscriptions
where company_id = '10000000-0000-4000-8000-000000000001';

delete from public.companies
where id = '10000000-0000-4000-8000-000000000001';

commit;
