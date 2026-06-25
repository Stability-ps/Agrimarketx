alter table public.farms
add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values
  ('animal-media', 'animal-media', true),
  ('farm-assets', 'farm-assets', true)
on conflict (id) do update set public = excluded.public;

create policy "Authenticated users read animal media files" on storage.objects
for select to authenticated using (bucket_id = 'animal-media');

create policy "Authenticated users upload animal media files" on storage.objects
for insert to authenticated with check (bucket_id = 'animal-media');

create policy "Authenticated users update animal media files" on storage.objects
for update to authenticated using (bucket_id = 'animal-media') with check (bucket_id = 'animal-media');

create policy "Authenticated users read farm asset files" on storage.objects
for select to authenticated using (bucket_id = 'farm-assets');

create policy "Authenticated users upload farm asset files" on storage.objects
for insert to authenticated with check (bucket_id = 'farm-assets');

create policy "Authenticated users update farm asset files" on storage.objects
for update to authenticated using (bucket_id = 'farm-assets') with check (bucket_id = 'farm-assets');
