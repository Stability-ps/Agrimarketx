create index if not exists marketplace_listings_status_created_at_idx
on public.marketplace_listings(status, created_at desc);

create index if not exists marketplace_listings_status_category_created_at_idx
on public.marketplace_listings(status, category, created_at desc);

create index if not exists marketplace_listings_status_category_subcategory_created_at_idx
on public.marketplace_listings(status, category, subcategory, created_at desc);

create index if not exists marketplace_listings_seller_status_created_at_idx
on public.marketplace_listings(seller_farm_id, status, created_at desc);

create index if not exists marketplace_listings_province_town_status_idx
on public.marketplace_listings(province, town, status);

create index if not exists marketplace_listing_media_listing_primary_idx
on public.marketplace_listing_media(listing_id, is_primary, created_at desc);

create index if not exists marketplace_enquiries_listing_status_idx
on public.marketplace_enquiries(listing_id, status, created_at desc);

create index if not exists marketplace_enquiries_seller_status_idx
on public.marketplace_enquiries(seller_farm_id, status, created_at desc);

create index if not exists buyer_requests_status_created_at_idx
on public.buyer_requests(status, created_at desc);

create index if not exists buyer_requests_category_subcategory_status_idx
on public.buyer_requests(category, subcategory, status);

create index if not exists buyer_requests_buyer_status_idx
on public.buyer_requests(buyer_id, status, created_at desc);

create index if not exists buyer_request_responses_request_idx
on public.buyer_request_responses(request_id, created_at desc);

create index if not exists buyer_request_responses_seller_idx
on public.buyer_request_responses(seller_farm_id, created_at desc);

create index if not exists buyer_request_media_request_primary_idx
on public.buyer_request_media(request_id, is_primary, created_at desc);

create index if not exists conversations_listing_idx
on public.conversations(listing_id, created_at desc);

create index if not exists conversations_status_updated_idx
on public.conversations(status, updated_at desc);

create index if not exists conversation_participants_user_idx
on public.conversation_participants(user_id, conversation_id);

create index if not exists conversation_participants_farm_idx
on public.conversation_participants(farm_id, conversation_id);

create index if not exists conversation_messages_conversation_created_idx
on public.conversation_messages(conversation_id, created_at desc);

create index if not exists support_tickets_created_by_status_idx
on public.support_tickets(created_by, status, created_at desc);

create index if not exists support_tickets_status_updated_idx
on public.support_tickets(status, updated_at desc);

create index if not exists app_notifications_user_read_created_idx
on public.app_notifications(user_id, read_at, created_at desc);

create index if not exists app_notifications_farm_created_idx
on public.app_notifications(farm_id, created_at desc);

create index if not exists locations_province_town_idx
on public.locations(province, town);

create index if not exists farm_followers_farm_idx
on public.farm_followers(farm_id, created_at desc);

create index if not exists farm_followers_user_idx
on public.farm_followers(user_id, created_at desc);
