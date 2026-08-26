-- Additive owner-profile and publishing fields. Existing singular category and
-- menu rows remain valid so older clients and public reads keep working.
alter table restaurants
  add column restaurant_categories text[] not null default '{}',
  add column custom_facilities text[] not null default '{}';

update restaurants
set restaurant_categories = array[restaurant_category]
where restaurant_category is not null
  and trim(restaurant_category) <> ''
  and cardinality(restaurant_categories) = 0;

alter table menu_items
  add column section_name text not null default 'Menu'
  check (char_length(trim(section_name)) between 1 and 60);

create table restaurant_menu_sections (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 60),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create unique index restaurant_menu_sections_name_idx
  on restaurant_menu_sections (restaurant_id, lower(name));

alter table restaurant_menu_sections enable row level security;

create policy "owner manages own menu sections"
  on restaurant_menu_sections
  for all
  using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create function create_default_restaurant_menu_section()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.restaurant_menu_sections (restaurant_id, name)
  values (new.id, 'Menu')
  on conflict do nothing;
  return new;
end;
$$;

create trigger restaurant_default_menu_section
after insert on restaurants
for each row execute function create_default_restaurant_menu_section();

insert into restaurant_menu_sections (restaurant_id, name, sort_order)
select id, 'Menu', 0
from restaurants
on conflict do nothing;

alter table offers add column image_url text;
