-- Rich event discovery fields and the 15-day publishing rule.

alter type event_type add value if not exists 'dj_night';
alter type event_type add value if not exists 'comedy';
alter type event_type add value if not exists 'party';
alter type event_type add value if not exists 'gaming';
alter type event_type add value if not exists 'cultural';

alter table events
  add column if not exists entry_fee int check (entry_fee is null or entry_fee >= 0),
  add column if not exists location_details text,
  add column if not exists ticket_url text;

create or replace function enforce_event_publish_window()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.starts_at > now() + interval '15 days' then
    raise exception 'Events can be scheduled up to 15 days ahead.';
  end if;
  return new;
end;
$$;

drop trigger if exists events_publish_window on events;
create trigger events_publish_window
before insert or update of starts_at on events
for each row execute function enforce_event_publish_window();

create or replace view event_interest_counts
with (security_invoker = off)
as
select event_id, count(*)::int as interest_count
from event_rsvps
group by event_id;

grant select on event_interest_counts to anon, authenticated;
