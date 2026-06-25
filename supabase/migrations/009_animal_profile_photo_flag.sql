alter table public.animal_media
add column if not exists is_profile boolean not null default false;

with first_photos as (
  select distinct on (animal_id) id
  from public.animal_media
  where media_type = 'photo'
  order by animal_id, created_at asc
)
update public.animal_media
set is_profile = true
where id in (select id from first_photos)
  and not exists (
    select 1
    from public.animal_media existing
    where existing.animal_id = public.animal_media.animal_id
      and existing.media_type = 'photo'
      and existing.is_profile = true
  );
