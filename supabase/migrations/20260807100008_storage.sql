-- P5-5: one public-read bucket for all restaurant imagery. Client resizes to
-- 1600px WebP before upload (architecture.md §1 storage budget).

insert into storage.buckets (id, name, public)
values ('restaurant-images', 'restaurant-images', true)
on conflict (id) do nothing;

create policy "public reads restaurant images" on storage.objects
  for select using (bucket_id = 'restaurant-images');

-- Uploads land under <restaurant_id>/... and only that restaurant's owner writes.
create policy "owner uploads own restaurant images" on storage.objects
  for insert with check (
    bucket_id = 'restaurant-images'
    and owns_restaurant(((storage.foldername(name))[1])::uuid)
  );

create policy "owner deletes own restaurant images" on storage.objects
  for delete using (
    bucket_id = 'restaurant-images'
    and owns_restaurant(((storage.foldername(name))[1])::uuid)
  );
