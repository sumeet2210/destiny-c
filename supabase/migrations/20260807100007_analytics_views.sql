-- P7-1: aggregation views for the owner dashboard, and the trending signal.
-- security_invoker so profile_views RLS (owner reads own) applies to callers.

create view restaurant_views_by_day with (security_invoker = on) as
  select
    restaurant_id,
    (created_at at time zone 'Asia/Kolkata')::date as day,
    count(*) as views
  from profile_views
  group by restaurant_id, day;

create view restaurant_views_by_source with (security_invoker = on) as
  select
    restaurant_id,
    source_filter,
    count(*) as views
  from profile_views
  group by restaurant_id, source_filter;

-- Trending = most profile views in the last 24h (PRD §5.3 sort). Public data,
-- aggregate only — runs as owner so anon can read counts without row access.
create function trending_restaurants(since interval default interval '24 hours')
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
