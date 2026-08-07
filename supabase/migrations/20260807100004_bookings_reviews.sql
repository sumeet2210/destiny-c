-- P1-8: bookings + reviews + RLS.
-- Bookings are NEVER readable by friends, under any setting (PRD §5.9).

create table bookings (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references users (id) on delete cascade,
  restaurant_id    uuid not null references restaurants (id) on delete cascade,
  headcount        int not null check (headcount >= 1),
  special_request  text,
  booking_time     timestamptz not null,
  status           booking_status not null default 'requested',
  reminder_sent_at timestamptz,
  confirmed_at     timestamptz,
  owner_note       text,
  owner_note_at    timestamptz,
  created_at       timestamptz not null default now()
);

alter table bookings enable row level security;

create policy "student reads own bookings" on bookings
  for select using (student_id = auth.uid());

create policy "owner reads bookings for own restaurants" on bookings
  for select using (owns_restaurant(restaurant_id));

-- 1-hour lead time enforced here as the last line of defence; the API route and
-- the form both check it first (PRD §5.7).
create policy "student inserts own booking" on bookings
  for insert with check (
    student_id = auth.uid()
    and booking_time >= now() + interval '1 hour'
  );

create policy "student confirms own booking" on bookings
  for update using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Owners annotate; they never accept, decline, or modify (PRD §5.7).
-- Column-level enforcement lives in the trigger below.
create policy "owner annotates bookings" on bookings
  for update using (owns_restaurant(restaurant_id))
  with check (owns_restaurant(restaurant_id));

create function enforce_booking_update_rules()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Service role (cron sweeps) bypasses RLS and this guard entirely.
  if auth.uid() is null then
    return new;
  end if;

  if new.student_id <> old.student_id
    or new.restaurant_id <> old.restaurant_id
    or new.created_at <> old.created_at then
    raise exception 'booking identity fields are immutable';
  end if;

  if auth.uid() = old.student_id then
    -- Students may confirm (set confirmed_at) or cancel; nothing else.
    if new.headcount <> old.headcount
      or new.booking_time <> old.booking_time
      or coalesce(new.special_request, '') <> coalesce(old.special_request, '')
      or coalesce(new.owner_note, '') <> coalesce(old.owner_note, '')
      or new.status not in (old.status, 'cancelled') then
      raise exception 'students may only confirm or cancel a booking';
    end if;
  else
    -- The restaurant owner: note only, no status change (PRD §5.7).
    if new.status <> old.status
      or new.headcount <> old.headcount
      or new.booking_time <> old.booking_time
      or coalesce(new.special_request, '') <> coalesce(old.special_request, '')
      or new.confirmed_at is distinct from old.confirmed_at
      or new.reminder_sent_at is distinct from old.reminder_sent_at then
      raise exception 'owners may only leave a note on a booking';
    end if;
  end if;

  return new;
end;
$$;

create trigger booking_update_rules
  before update on bookings
  for each row execute function enforce_booking_update_rules();

create index bookings_student_idx on bookings (student_id);
create index bookings_restaurant_time_idx on bookings (restaurant_id, booking_time);
create index bookings_status_time_idx on bookings (status, booking_time);

-- Owners need the booking student's name on their list.
create policy "owners read students who booked" on users
  for select using (
    exists (
      select 1
      from bookings b
      join restaurants r on r.id = b.restaurant_id
      where b.student_id = users.id and r.owner_id = auth.uid()
    )
  );

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references bookings (id) on delete cascade,
  student_id    uuid not null references users (id) on delete cascade,
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "public reads reviews of active restaurants" on reviews
  for select using (restaurant_is_active(restaurant_id) or owns_restaurant(restaurant_id));

-- Gated to a verified visit: the booking is yours, at this restaurant, completed,
-- and confirmed (a no-show 'completed' booking has no confirmed_at).
create policy "student reviews own completed booking" on reviews
  for insert with check (
    student_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = reviews.booking_id
        and b.student_id = auth.uid()
        and b.restaurant_id = reviews.restaurant_id
        and b.status = 'completed'
        and b.confirmed_at is not null
    )
  );

create policy "student deletes own review" on reviews
  for delete using (student_id = auth.uid());

create index reviews_restaurant_idx on reviews (restaurant_id, created_at desc);
