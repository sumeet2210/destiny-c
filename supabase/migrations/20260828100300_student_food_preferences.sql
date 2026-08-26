-- Student taste preferences, shown on the account page and used to order
-- craving suggestions. Optional by design: discovery must stay useful for a
-- student who never fills these in (PRODUCT.md, "Product Principles" 3).
--
-- Guarded so it is a no-op on a database that already took these columns.
alter table users
  add column if not exists food_type text,
  add column if not exists favorite_cuisines text[] not null default '{}',
  add column if not exists spice_preference text;

-- Added separately from the columns so re-running the migration cannot fail on
-- a duplicate constraint name. The allowlists are mirrored in
-- config/food-preferences.ts and re-checked in lib/auth/actions.ts, so a bad
-- value has to get through three layers to reach the table.
alter table users
  drop constraint if exists users_food_type_check;

alter table users
  add constraint users_food_type_check
  check (
    food_type is null
    or food_type in ('vegetarian', 'non_vegetarian', 'vegan', 'other')
  );

alter table users
  drop constraint if exists users_spice_preference_check;

alter table users
  add constraint users_spice_preference_check
  check (
    spice_preference is null
    or spice_preference in ('low', 'medium', 'high')
  );
