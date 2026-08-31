-- Keep cancellation aligned with the student UI: only an upcoming requested
-- or confirmed booking can be cancelled. Owner rejection and service-role
-- status sweeps continue to use their existing transitions.
create or replace function enforce_active_student_cancellation()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() <> old.student_id then
    return new;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    if old.status not in ('requested', 'confirmed')
      or old.booking_time <= now() then
      raise exception 'only active upcoming bookings can be cancelled';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists active_student_booking_cancellation on bookings;
create trigger active_student_booking_cancellation
  before update on bookings
  for each row execute function enforce_active_student_cancellation();
