-- P1-2 + P1-3: restaurants + RLS + is_open_now().

create table restaurants (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references users (id) on delete cascade,
  name              text not null,
  description       text,
  area              text not null,
  address           text,
  lat               numeric,
  lng               numeric,
  phone             text,
  is_veg_only       boolean not null default false,
  has_ac            boolean not null default false,
  dine_in           boolean not null default true,
  takeaway          boolean not null default true,
  student_discount  boolean not null default false,
  price_per_head    int,
  vibe_tags         text[] not null default '{}',
  opening_hours     jsonb,
  cover_image_url   text,
  status            restaurant_status not null default 'pending_approval',
  created_at        timestamptz not null default now()
);

alter table restaurants enable row level security;

create policy "public reads active restaurants" on restaurants
  for select using (status = 'active' or owner_id = auth.uid());

create policy "owner inserts own restaurant" on restaurants
  for insert with check (owner_id = auth.uid());

create policy "owner updates own restaurant" on restaurants
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status = (select r.status from restaurants r where r.id = restaurants.id));
-- Owners cannot self-approve: status changes happen via the Supabase dashboard
-- (service role) only. See docs/runbook.md.

create index restaurants_status_idx on restaurants (status);
create index restaurants_area_idx on restaurants (area);
create index restaurants_vibe_tags_idx on restaurants using gin (vibe_tags);

-- P1-3: open-now computed in SQL so the filter and the badge can't disagree.
-- opening_hours shape (architecture.md §2): {"mon":[{"open":"11:00","close":"23:00"}], ...}
-- Times are local wall-clock Asia/Kolkata. close < open means past midnight.
-- Empty array or missing key means closed that day.
create function is_open_now(hours jsonb, at_time timestamptz default now())
returns boolean
language plpgsql stable as $$
declare
  local_ts timestamp;
  day_keys text[] := array['sun','mon','tue','wed','thu','fri','sat'];
  today text;
  yesterday text;
  now_min int;
  shift jsonb;
  open_min int;
  close_min int;
begin
  if hours is null then
    return false;
  end if;

  local_ts := at_time at time zone 'Asia/Kolkata';
  today := day_keys[extract(dow from local_ts)::int + 1];
  yesterday := day_keys[((extract(dow from local_ts)::int + 6) % 7) + 1];
  now_min := extract(hour from local_ts)::int * 60 + extract(minute from local_ts)::int;

  -- Today's shifts, including ones that run past midnight (open until 24:00 today).
  for shift in select jsonb_array_elements(coalesce(hours -> today, '[]'::jsonb))
  loop
    open_min := split_part(shift ->> 'open', ':', 1)::int * 60 + split_part(shift ->> 'open', ':', 2)::int;
    close_min := split_part(shift ->> 'close', ':', 1)::int * 60 + split_part(shift ->> 'close', ':', 2)::int;
    if close_min > open_min then
      if now_min >= open_min and now_min < close_min then
        return true;
      end if;
    elsif close_min < open_min then
      if now_min >= open_min then
        return true;
      end if;
    end if;
  end loop;

  -- Yesterday's shifts that spilled past midnight into this morning.
  for shift in select jsonb_array_elements(coalesce(hours -> yesterday, '[]'::jsonb))
  loop
    open_min := split_part(shift ->> 'open', ':', 1)::int * 60 + split_part(shift ->> 'open', ':', 2)::int;
    close_min := split_part(shift ->> 'close', ':', 1)::int * 60 + split_part(shift ->> 'close', ':', 2)::int;
    if close_min < open_min and now_min < close_min then
      return true;
    end if;
  end loop;

  return false;
end;
$$;
