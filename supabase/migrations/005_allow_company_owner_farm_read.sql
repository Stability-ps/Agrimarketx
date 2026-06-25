create policy "Company owners can read farms"
on public.farms
for select
using (public.is_company_owner(company_id));
