create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url, account_role, account_type_selected)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'account_role' = 'seller' then 'seller' else 'buyer' end,
    coalesce((new.raw_user_meta_data ->> 'account_type_selected')::boolean, false)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    account_role = coalesce(public.profiles.account_role, excluded.account_role, 'buyer'),
    account_type_selected = public.profiles.account_type_selected or excluded.account_type_selected;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
