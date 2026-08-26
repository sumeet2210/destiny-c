-- Restores the baseline `restaurant_status` vocabulary and repairs the two
-- helpers the abandoned onboarding rename silently broke.
--
-- Background. A later, now-abandoned migration ran:
--     alter type restaurant_status rename value 'pending_approval' to 'profile_incomplete';
--     alter type restaurant_status rename value 'active'           to 'live';
-- Postgres stores RLS policies and views as parsed trees, so a value rename is
-- invisible to them -- `public reads active restaurants` kept working and kept
-- returning rows. It stores `language sql` function bodies as TEXT and re-parses
-- them on every call, so `restaurant_is_active()` and `trending_restaurants()`
-- began raising 22P02 ("invalid input value for enum restaurant_status") the
-- moment the rename landed. Every public read routed through those helpers --
-- menu_items, offers, restaurant_photos, events, reviews, trending -- started
-- failing, and lib/queries/catalog.ts collapsed each error into an empty array,
-- so the whole catalog emptied without a single log line. Restaurants rendered
-- with no photos, no rating, no offers and no craving tags; menus and events
-- disappeared for seeded and real restaurants alike.
--
-- Lesson worth keeping: never rename a value of an enum this schema stores in a
-- `language sql` body. Add a new value instead.
--
-- Every statement below is guarded, so this migration is a no-op on a database
-- built from the migrations in this branch and a repair on one that took the
-- rename.

-- 1. Put the value names back. Existing rows follow the label automatically,
--    because a rename keeps the pg_enum OID -- no data is rewritten and nothing
--    changes which restaurants are publicly visible.
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'restaurant_status' and e.enumlabel = 'live'
  ) then
    execute $ddl$alter type restaurant_status rename value 'live' to 'active'$ddl$;
  end if;

  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'restaurant_status' and e.enumlabel = 'profile_incomplete'
  ) then
    execute $ddl$alter type restaurant_status rename value 'profile_incomplete' to 'pending_approval'$ddl$;
  end if;
end $$;

-- Note: a `profile_review` label may survive on an already-migrated database.
-- Postgres cannot drop an enum value without recreating the type and every
-- dependent policy, default and function, which is far riskier than leaving an
-- unused label in place. No code path in this branch reads or writes it.

-- 2. Recreate the text-bodied helpers so they re-parse cleanly against the
--    restored vocabulary. Bodies are byte-identical to their original
--    definitions -- this migration only repairs, it does not change behaviour.
create or replace function restaurant_is_active(rid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from restaurants r where r.id = rid and r.status = 'active'
  );
$$;

create or replace function trending_restaurants(since interval default interval '24 hours')
returns table (restaurant_id uuid, views bigint)
language sql stable security definer set search_path = public as $$
  select pv.restaurant_id, count(*) as views
  from profile_views pv
  join restaurants r on r.id = pv.restaurant_id
  where pv.created_at >= now() - since
    and r.status = 'active'
  group by pv.restaurant_id
  order by views desc;
$$;

-- 3. Restore owner self-service restaurant creation. The abandoned onboarding
--    work dropped this policy because applications were meant to create the row
--    through a service-role function instead; that workflow is not part of this
--    branch, so an owner with no restaurant would otherwise be permanently
--    stuck. Matches 20260807100002_restaurants_and_hours.sql exactly.
drop policy if exists "owner inserts own restaurant" on restaurants;

create policy "owner inserts own restaurant" on restaurants
  for insert with check (owner_id = auth.uid());
