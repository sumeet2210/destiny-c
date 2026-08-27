-- Empty gallery folders must persist before an owner uploads photos into them.
-- This migration predates the consolidated owner migration so the deployed
-- database and a clean database built from this repository share one schema.
create table if not exists restaurant_gallery_folders (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 40),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, name)
);

create unique index if not exists restaurant_gallery_folders_name_idx
  on restaurant_gallery_folders (restaurant_id, lower(name));

alter table restaurant_gallery_folders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'restaurant_gallery_folders'
      and policyname = 'owner manages own gallery folders'
  ) then
    create policy "owner manages own gallery folders"
      on restaurant_gallery_folders
      for all
      using (owns_restaurant(restaurant_id))
      with check (owns_restaurant(restaurant_id));
  end if;
end
$$;

-- gallery_category is introduced by 20260828100200_gallery_folders.sql. The
-- later 20260828100500_persistent_gallery_folders.sql migration backfills this
-- table after that column exists. Keeping this earlier migration limited to
-- the folder schema makes a clean migration run ordering-safe.

notify pgrst, 'reload schema';
