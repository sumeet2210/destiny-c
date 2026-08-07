-- P1-9: profile_views. Insert-only for the public; owner reads own restaurant's rows.
-- This is profile PAGE VIEWS, never footfall (PRD §3) — keep the name honest.

create table profile_views (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  viewer_id     uuid references users (id) on delete set null,
  source_filter text not null default 'direct',
  created_at    timestamptz not null default now()
);

alter table profile_views enable row level security;

create policy "anyone logs a profile view" on profile_views
  for insert with check (viewer_id is null or viewer_id = auth.uid());

create policy "owner reads own restaurant views" on profile_views
  for select using (owns_restaurant(restaurant_id));

create index profile_views_restaurant_time_idx on profile_views (restaurant_id, created_at desc);
create index profile_views_source_idx on profile_views (restaurant_id, source_filter);
