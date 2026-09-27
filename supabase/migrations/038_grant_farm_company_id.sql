-- 038: hotfix for 036. RLS policies on other tables run their subqueries with
-- the caller's privileges; two of them join farms on company_id:
--   farm_members  "Company owners create first farm owner membership" (onboarding)
--   companies     "Farm members can read companies"
-- 036 did not grant farms.company_id, so new sellers could not create their
-- owner membership (permission denied). company_id is an internal UUID, not
-- personal data; grant it to signed-in users only.
grant select (company_id) on public.farms to authenticated;
