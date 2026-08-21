-- Add a real booking window to support start/end times in the booking flow.

alter table bookings
  add column booking_end_time timestamptz;

update bookings
set booking_end_time = booking_time + interval '1 hour'
where booking_end_time is null;

alter table bookings
  alter column booking_end_time set not null;

drop policy if exists "student inserts own booking" on bookings;
create policy "student inserts own booking" on bookings
  for insert with check (
    student_id = auth.uid()
    and booking_time >= now() + interval '1 hour'
    and booking_end_time > booking_time
  );

create or replace function enforce_booking_update_rules()
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
      or new.booking_end_time <> old.booking_end_time
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
      or new.booking_end_time <> old.booking_end_time
      or coalesce(new.special_request, '') <> coalesce(old.special_request, '')
      or new.confirmed_at is distinct from old.confirmed_at
      or new.reminder_sent_at is distinct from old.reminder_sent_at then
      raise exception 'owners may only leave a note on a booking';
    end if;
  end if;

  return new;
end;
$$;
