-- Owners can organize manually entered menu items under their own headings.
alter table menu_items
  add column if not exists section_name text not null default 'Menu'
  check (char_length(trim(section_name)) between 1 and 80);
create index if not exists menu_items_restaurant_section_idx
  on menu_items (restaurant_id, section_name);
create table if not exists menu_sections (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);
alter table menu_sections enable row level security;
create policy "owner manages own menu sections" on menu_sections
  for all using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));
create index if not exists menu_sections_restaurant_order_idx
  on menu_sections (restaurant_id, sort_order, created_at);
