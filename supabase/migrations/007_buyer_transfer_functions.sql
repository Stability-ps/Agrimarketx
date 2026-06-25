create or replace function public.buyer_select_transfer_delivery(
  transfer_id uuid,
  selected_delivery_method text,
  selected_buyer_farm_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if selected_delivery_method not in ('collect', 'delivery') then
    raise exception 'Choose collect or delivery.';
  end if;

  if not exists (
    select 1
    from public.ownership_transfers ot
    where ot.id = transfer_id
      and ot.buyer_user_id = auth.uid()
      and ot.status in ('seller_ready', 'awaiting_collection')
  ) then
    raise exception 'Transfer not found for this buyer.';
  end if;

  if not public.is_farm_member(selected_buyer_farm_id) then
    raise exception 'Choose one of your farms.';
  end if;

  update public.ownership_transfers
  set buyer_farm_id = selected_buyer_farm_id,
      delivery_method = selected_delivery_method,
      status = 'awaiting_collection'
  where id = transfer_id;
end;
$$;

create or replace function public.complete_ownership_transfer(
  transfer_id uuid,
  selected_buyer_farm_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  transfer_record public.ownership_transfers%rowtype;
begin
  select *
  into transfer_record
  from public.ownership_transfers
  where id = transfer_id
    and buyer_user_id = auth.uid()
    and status = 'delivered';

  if transfer_record.id is null then
    raise exception 'Transfer must be delivered before buyer can confirm received.';
  end if;

  if not public.is_farm_member(selected_buyer_farm_id) then
    raise exception 'Choose one of your farms.';
  end if;

  update public.ownership_history
  set released_at = now()
  where animal_id = transfer_record.animal_id
    and farm_id = transfer_record.seller_farm_id
    and released_at is null;

  update public.animals
  set farm_id = selected_buyer_farm_id,
      status = 'alive',
      origin = 'marketplace_purchase',
      sold_at = null,
      updated_at = now()
  where id = transfer_record.animal_id;

  insert into public.ownership_history (animal_id, farm_id, owner_user_id, transfer_id)
  values (transfer_record.animal_id, selected_buyer_farm_id, auth.uid(), transfer_id);

  update public.ownership_transfers
  set buyer_farm_id = selected_buyer_farm_id,
      status = 'received',
      received_at = now()
  where id = transfer_id;

  update public.marketplace_listings
  set status = 'sold'
  where animal_id = transfer_record.animal_id
    and seller_farm_id = transfer_record.seller_farm_id;
end;
$$;

grant execute on function public.buyer_select_transfer_delivery(uuid, text, uuid) to authenticated;
grant execute on function public.complete_ownership_transfer(uuid, uuid) to authenticated;
