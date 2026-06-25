drop policy if exists "Company owners can create farms" on public.farms;

create policy "Company owners can create farms" on public.farms
for insert
with check (
  exists (
    select 1
    from public.companies
    where companies.id = farms.company_id
      and companies.owner_id = auth.uid()
  )
);
