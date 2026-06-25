alter table public.marketplace_listings
add column if not exists chat_clicks_count int not null default 0,
add column if not exists share_clicks_count int not null default 0,
add column if not exists similar_clicks_count int not null default 0;

create or replace function public.increment_listing_metric(listing_id uuid, metric text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.marketplace_listings
  set
    views_count = views_count + case when metric = 'view' then 1 else 0 end,
    contact_clicks_count = contact_clicks_count + case when metric = 'contact' then 1 else 0 end,
    whatsapp_clicks_count = whatsapp_clicks_count + case when metric = 'whatsapp' then 1 else 0 end,
    call_clicks_count = call_clicks_count + case when metric = 'call' then 1 else 0 end,
    chat_clicks_count = chat_clicks_count + case when metric = 'chat' then 1 else 0 end,
    share_clicks_count = share_clicks_count + case when metric = 'share' then 1 else 0 end,
    similar_clicks_count = similar_clicks_count + case when metric = 'similar' then 1 else 0 end
  where id = listing_id;
end;
$$;
