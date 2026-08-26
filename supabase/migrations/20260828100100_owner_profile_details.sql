-- Expand the owner-editable restaurant profile with discovery and amenity data.
--
-- Every statement is guarded, so this is safe to apply to a database that
-- already took these columns from the abandoned onboarding branch.
--
-- Deliberately NOT included: the `array_replace(vibe_tags, 'study', 'work')`
-- rewrite that shipped alongside these columns upstream. `study` is one of the
-- eight vibes PRD §5.3 names and docs/decisions.md 2026-08-07 settled, and it is
-- still referenced by config/quiz.ts and lib/domain/restaurant-match.ts, so
-- renaming the tag would have orphaned the quiz's "somewhere to study" answer.
alter table restaurants
  add column if not exists owner_name text,
  add column if not exists restaurant_category text,
  add column if not exists cuisines text[] not null default '{}',
  add column if not exists delivery boolean not null default false,
  add column if not exists outdoor_seating boolean not null default false,
  add column if not exists parking boolean not null default false,
  add column if not exists wifi boolean not null default false,
  add column if not exists upi_card boolean not null default false,
  add column if not exists wheelchair_accessible boolean not null default false,
  add column if not exists family_friendly boolean not null default false;

create index if not exists restaurants_cuisines_idx
  on restaurants using gin (cuisines);
