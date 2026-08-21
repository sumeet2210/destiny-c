-- Turn booking notices into owner-reviewed reservations and persist optional
-- offer/event choices so both sides see the same reservation context.
alter table bookings
  add column if not exists offer_id uuid references offers (id) on delete set null,
  add column if not exists event_id uuid references events (id) on delete set null,
  add column if not exists owner_decided_at timestamptz,
  add column if not exists owner_response text check (owner_response in ('accepted', 'rejected'));

create or replace function enforce_booking_update_rules()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.student_id <> old.student_id
    or new.restaurant_id <> old.restaurant_id
    or new.created_at <> old.created_at
    or new.headcount <> old.headcount
    or new.booking_time <> old.booking_time
    or new.booking_end_time <> old.booking_end_time
    or coalesce(new.special_request, '') <> coalesce(old.special_request, '')
    or new.offer_id is distinct from old.offer_id
    or new.event_id is distinct from old.event_id then
    raise exception 'reservation details are immutable';
  end if;

  if auth.uid() = old.student_id then
    if coalesce(new.owner_note, '') <> coalesce(old.owner_note, '')
      or new.owner_decided_at is distinct from old.owner_decided_at
      or new.owner_response is distinct from old.owner_response
      or new.status not in (old.status, 'cancelled') then
      raise exception 'students may only confirm or cancel a reservation';
    end if;
  else
    if new.confirmed_at is distinct from old.confirmed_at
      or new.reminder_sent_at is distinct from old.reminder_sent_at
      or not (
        new.status = old.status
        or (old.status = 'requested' and new.status in ('confirmed', 'cancelled'))
      ) then
      raise exception 'owners may only accept, reject, or annotate a reservation';
    end if;
  end if;

  return new;
end;
$$;
