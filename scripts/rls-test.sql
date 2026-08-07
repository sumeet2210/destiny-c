-- P1-11: RLS test script for the social layer — the only policies in the app
-- where a bug leaks one student's data to another. Run against DEV after
-- migrations + seed:  psql "$DEV_DB_URL" -f scripts/rls-test.sql
-- Every block raises an exception on failure; silence means pass.
--
-- Cast: student1 (sharer, friend of student2), student2 (friend),
--       student3 (non-friend). student1 has share_activity toggled per case.

begin;

-- Fixture: friendship student1 <-> student2 accepted; student1 saved restaurant 1.
insert into friendships (requester_id, addressee_id, status, responded_at)
values ('00000000-0000-4000-8008-000000000001', '00000000-0000-4000-8008-000000000002', 'accepted', now())
on conflict do nothing;
insert into saved_restaurants (student_id, restaurant_id)
values ('00000000-0000-4000-8008-000000000001', '00000000-0000-4000-8000-000000000001')
on conflict do nothing;

create or replace function assert_eq(actual bigint, expected bigint, label text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL %: expected %, got %', label, expected, actual;
  end if;
  raise notice 'PASS %', label;
end;
$$;

-- Impersonate a user the way PostgREST does.
create or replace procedure impersonate(uid uuid)
language plpgsql as $$
begin
  execute format(
    'set local request.jwt.claims = ''{"sub": "%s", "role": "authenticated"}''', uid);
  set local role authenticated;
end;
$$;

---------------------------------------------------------------------------
-- Case A: sharing ON — friend sees saved list, stranger doesn't.
---------------------------------------------------------------------------
reset role;
update users set share_activity = true where id = '00000000-0000-4000-8008-000000000001';

call impersonate('00000000-0000-4000-8008-000000000002');
select assert_eq(
  (select count(*) from saved_restaurants where student_id = '00000000-0000-4000-8008-000000000001'),
  1, 'A1: friend sees saved when sharing on');

reset role;
call impersonate('00000000-0000-4000-8008-000000000003');
select assert_eq(
  (select count(*) from saved_restaurants where student_id = '00000000-0000-4000-8008-000000000001'),
  0, 'A2: non-friend never sees saved');

---------------------------------------------------------------------------
-- Case B: sharing OFF — even the friend sees nothing.
---------------------------------------------------------------------------
reset role;
update users set share_activity = false where id = '00000000-0000-4000-8008-000000000001';

call impersonate('00000000-0000-4000-8008-000000000002');
select assert_eq(
  (select count(*) from saved_restaurants where student_id = '00000000-0000-4000-8008-000000000001'),
  0, 'B1: friend sees nothing when sharing off');

---------------------------------------------------------------------------
-- Case C: bookings are NEVER visible to friends, under any setting.
---------------------------------------------------------------------------
reset role;
update users set share_activity = true where id = '00000000-0000-4000-8008-000000000001';

call impersonate('00000000-0000-4000-8008-000000000002');
select assert_eq(
  (select count(*) from bookings where student_id = '00000000-0000-4000-8008-000000000001'),
  0, 'C1: friend cannot read bookings even with sharing on');

---------------------------------------------------------------------------
-- Case D: RSVs follow the same two-key rule as saved.
---------------------------------------------------------------------------
reset role;
insert into event_rsvps (event_id, student_id)
select id, '00000000-0000-4000-8008-000000000001' from events limit 1
on conflict do nothing;

call impersonate('00000000-0000-4000-8008-000000000002');
select assert_eq(
  (select count(*) from event_rsvps where student_id = '00000000-0000-4000-8008-000000000001'),
  1, 'D1: friend sees RSVP when sharing on');

reset role;
call impersonate('00000000-0000-4000-8008-000000000003');
select assert_eq(
  (select count(*) from event_rsvps where student_id = '00000000-0000-4000-8008-000000000001'),
  0, 'D2: non-friend never sees RSVP');

rollback;
