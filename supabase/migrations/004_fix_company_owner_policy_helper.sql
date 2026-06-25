create or replace function public.is_company_owner(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies
    where id = target_company_id
      and owner_id = auth.uid()
  );
$$;

drop policy if exists "Company owners can create farms" on public.farms;

create policy "Company owners can create farms" on public.farms
for insert
with check (public.is_company_owner(company_id));
