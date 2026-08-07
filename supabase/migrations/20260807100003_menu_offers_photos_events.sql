-- P1-4..P1-7: menu_items, offers, restaurant_photos, events. RLS with each table.

-- Shared helper: does auth.uid() own this restaurant?
create function owns_restaurant(rid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from restaurants r where r.id = rid and r.owner_id = auth.uid()
  );
$$;

-- Shared helper: is this restaurant publicly visible?
create function restaurant_is_active(rid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from restaurants r where r.id = rid and r.status = 'active'
  );
$$;

create table menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name          text not null,
  price         int not null check (price >= 0),
  is_veg        boolean not null default false,
  craving_tags  text[] not null default '{}',
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table menu_items enable row level security;

create policy "public reads menu of active restaurants" on menu_items
  for select using (restaurant_is_active(restaurant_id) or owns_restaurant(restaurant_id));

create policy "owner writes own menu" on menu_items
  for all using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create index menu_items_restaurant_idx on menu_items (restaurant_id);
create index menu_items_craving_tags_idx on menu_items using gin (craving_tags);

create table offers (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  title         text not null,
  description   text,
  discount_text text,
  starts_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  is_active     boolean not null default true,
  flagged_count int not null default 0,
  created_at    timestamptz not null default now()
);

alter table offers enable row level security;

create policy "public reads live offers of active restaurants" on offers
  for select using (
    (is_active and restaurant_is_active(restaurant_id))
    or owns_restaurant(restaurant_id)
  );

create policy "owner writes own offers" on offers
  for all using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create index offers_restaurant_idx on offers (restaurant_id);
create index offers_active_expiry_idx on offers (is_active, expires_at);

-- P5-11: students flag a wrong offer. Increment-only, via RPC so no update policy
-- on offers is needed for students.
create function flag_offer(offer_id uuid)
returns void
language sql security definer set search_path = public as $$
  update offers set flagged_count = flagged_count + 1 where id = offer_id;
$$;

create table restaurant_photos (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  url           text not null,
  kind          photo_kind not null default 'gallery',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

alter table restaurant_photos enable row level security;

create policy "public reads photos of active restaurants" on restaurant_photos
  for select using (restaurant_is_active(restaurant_id) or owns_restaurant(restaurant_id));

create policy "owner writes own photos" on restaurant_photos
  for all using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create index restaurant_photos_restaurant_idx on restaurant_photos (restaurant_id, kind, sort_order);

create table events (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants (id) on delete cascade,
  title           text not null,
  description     text,
  event_type      event_type not null default 'other',
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  cover_image_url text,
  is_cancelled    boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table events enable row level security;

create policy "public reads events of active restaurants" on events
  for select using (
    (not is_cancelled and restaurant_is_active(restaurant_id))
    or owns_restaurant(restaurant_id)
  );

create policy "owner writes own events" on events
  for all using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create index events_restaurant_idx on events (restaurant_id);
create index events_starts_at_idx on events (starts_at);
