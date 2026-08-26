-- Persist owner-created gallery folders even before they contain photos.
-- Photos keep their existing free-text gallery_category so the public gallery
-- and all existing rows continue to work without a rewrite.
create table restaurant_gallery_folders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 40),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, name)
);

-- Treat case-only variants as the same folder.
create unique index restaurant_gallery_folders_name_idx
  on restaurant_gallery_folders (restaurant_id, lower(name));

alter table restaurant_gallery_folders enable row level security;

create policy "owner manages own gallery folders"
  on restaurant_gallery_folders
  for all
  using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

-- Preserve every folder already represented by at least one gallery photo.
insert into restaurant_gallery_folders (restaurant_id, name, sort_order)
select restaurant_id, gallery_category, min(sort_order)
from restaurant_photos
where kind = 'gallery'
  and gallery_category is not null
  and trim(gallery_category) <> ''
group by restaurant_id, gallery_category
on conflict do nothing;
