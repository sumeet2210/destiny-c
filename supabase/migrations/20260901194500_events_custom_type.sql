alter table public.events
  add column if not exists custom_event_type text;

alter table public.events
  drop constraint if exists events_custom_event_type_length;

alter table public.events
  add constraint events_custom_event_type_length
  check (custom_event_type is null or char_length(custom_event_type) <= 60);
