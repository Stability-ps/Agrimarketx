create policy "Seller farms update marketplace offers" on public.marketplace_offers
for update using (
  exists (
    select 1 from public.marketplace_listings ml
    where ml.id = listing_id
      and public.has_farm_role(ml.seller_farm_id, array['owner','manager']::public.app_role[])
  )
) with check (
  exists (
    select 1 from public.marketplace_listings ml
    where ml.id = listing_id
      and public.has_farm_role(ml.seller_farm_id, array['owner','manager']::public.app_role[])
  )
);
