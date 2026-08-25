-- Student taste preferences used to personalize discovery and recommendations.
alter table users
  add column if not exists food_type text
    check (food_type in ('vegetarian', 'non_vegetarian', 'vegan', 'other')),
  add column if not exists favorite_cuisines text[] not null default '{}',
  add column if not exists spice_preference text
    check (spice_preference in ('low', 'medium', 'high'));
