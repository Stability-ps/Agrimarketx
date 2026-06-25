alter table public.profiles
add column if not exists account_role text not null default 'buyer'
  check (account_role in ('buyer', 'seller', 'admin', 'super_admin')),
add column if not exists account_type_selected boolean not null default false;

update public.profiles
set account_role = 'buyer'
where account_role is null;

update public.profiles p
set account_role = 'seller',
    account_type_selected = true
where exists (
  select 1
  from public.farm_members fm
  where fm.user_id = p.id
);

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_role = 'super_admin'
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_role in ('admin', 'super_admin')
  );
$$;

create or replace function public.protect_profile_account_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.account_role is null then
      new.account_role := 'buyer';
    end if;

    if new.account_role not in ('buyer', 'seller') and auth.uid() is not null and not public.is_super_admin() then
      raise exception 'Only a super admin can create admin accounts.';
    end if;

    return new;
  end if;

  if new.account_role is distinct from old.account_role then
    if new.id = auth.uid() and new.account_role in ('admin', 'super_admin') then
      raise exception 'Admin roles cannot be selected from signup or self-service profile editing.';
    end if;

    if new.account_role in ('admin', 'super_admin') and auth.uid() is not null and not public.is_super_admin() then
      raise exception 'Only a super admin can assign admin roles.';
    end if;

    if old.account_role in ('admin', 'super_admin') and auth.uid() is not null and not public.is_super_admin() then
      raise exception 'Only a super admin can change admin roles.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_account_role on public.profiles;
create trigger protect_profile_account_role
before insert or update on public.profiles
for each row execute function public.protect_profile_account_role();

drop policy if exists "Super admins update profile roles" on public.profiles;
create policy "Super admins update profile roles" on public.profiles
for update
using (public.is_super_admin())
with check (public.is_super_admin());
