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
  add column if not exists section_name text not null default 'Menu'
  check (char_length(trim(section_name)) between 1 and 60);

create unique index if not exists menu_sections_name_idx
  on menu_sections (restaurant_id, lower(name));

-- Preserve groupings already used by legacy menu items. Restaurants without
-- any items intentionally start with no section: the owner creates one first.
insert into menu_sections (restaurant_id, name, sort_order)
select restaurant_id, section_name, 0
from menu_items
group by restaurant_id, section_name
on conflict do nothing;

alter table offers add column if not exists image_url text;
