-- A reservation can carry one optional experience, never an offer and an
-- event at the same time. The API also enforces this for immediate feedback.
alter table bookings
  drop constraint if exists bookings_single_experience;

alter table bookings
  add constraint bookings_single_experience
  check (num_nonnulls(offer_id, event_id) <= 1) not valid;
