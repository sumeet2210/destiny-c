-- Expand the owner-editable restaurant profile with discovery and amenity data.
alter table restaurants
  add column owner_name text,
  add column restaurant_category text,
  add column cuisines text[] not null default '{}',
  add column delivery boolean not null default false,
  add column outdoor_seating boolean not null default false,
  add column parking boolean not null default false,
  add column wifi boolean not null default false,
  add column upi_card boolean not null default false,
  add column wheelchair_accessible boolean not null default false,
  add column family_friendly boolean not null default false;

-- "Work" replaces the old "Study" label while keeping existing profiles useful.
update restaurants
set vibe_tags = array_replace(vibe_tags, 'study', 'work')
where vibe_tags @> array['study']::text[];

create index restaurants_cuisines_idx on restaurants using gin (cuisines);
