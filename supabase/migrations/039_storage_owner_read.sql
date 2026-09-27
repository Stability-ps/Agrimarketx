-- 039: hotfix for 036. Supabase Storage locates objects for delete (and
-- move/copy/info) through the SELECT policy on storage.objects. 036 removed
-- the blanket "authenticated users read ..." policies, so owners could no
-- longer delete their own files (e.g. removing an animal photo silently did
-- nothing). Allow reading only objects the caller could also write, using
-- the same ownership rules as the 036 write policies. Public files are still
-- served through public URLs; nobody can list other people's files.

create policy "Owners read farm asset files"
on storage.objects for select to authenticated
using (bucket_id = 'farm-assets' and public.can_write_farm_asset(name));

create policy "Farm staff read animal media files"
on storage.objects for select to authenticated
using (
  bucket_id = 'animal-media'
  and public.has_farm_role(
    (case when split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$' then split_part(name, '/', 1)::uuid end),
    array['owner'::app_role, 'manager'::app_role, 'worker'::app_role, 'vet'::app_role]
  )
);
