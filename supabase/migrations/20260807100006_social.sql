-- P1-10: saved_restaurants, friendships, event_rsvps, friend_edges + RLS.
-- The only place in the app where a policy bug leaks one student's data to
-- another — P1-11's test script asserts every branch below.

create table saved_restaurants (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references users (id) on delete cascade,
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (student_id, restaurant_id)
);

create table friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users (id) on delete cascade,
  addressee_id uuid not null references users (id) on delete cascade,
  status       friendship_status not null default 'pending',
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- One row per pair: block A→B and B→A coexisting regardless of direction.
create unique index friendships_canonical_pair_idx
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  student_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, student_id)
);

-- Symmetric read model. Every social query and policy goes through this view or
-- the helper below — never through friendships directly (architecture.md §2).
create view friend_edges with (security_invoker = off) as
  select requester_id as user_id, addressee_id as friend_id
  from friendships where status = 'accepted'
  union all
  select addressee_id, requester_id
  from friendships where status = 'accepted';

-- The view runs as owner (security_invoker off) so RLS policies on other tables
-- can consult the full edge set; it is not exposed to clients directly.
revoke all on friend_edges from anon, authenticated;

create function is_accepted_friend(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friend_edges fe where fe.user_id = a and fe.friend_id = b
  );
$$;

create function shares_activity(u uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select share_activity from users where id = u), false);
$$;

alter table saved_restaurants enable row level security;

-- Both halves required: friendship alone isn't consent, and share_activity
-- alone isn't either (architecture.md §3).
create policy "self and consenting friends read saved" on saved_restaurants
  for select using (
    student_id = auth.uid()
    or (
      is_accepted_friend(auth.uid(), student_id)
      and shares_activity(student_id)
    )
  );

create policy "student saves for self" on saved_restaurants
  for insert with check (student_id = auth.uid());

create policy "student unsaves own" on saved_restaurants
  for delete using (student_id = auth.uid());

alter table friendships enable row level security;

create policy "parties read their friendship" on friendships
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "student sends request" on friendships
  for insert with check (requester_id = auth.uid() and status = 'pending');

create policy "addressee responds, requester withdraws" on friendships
  for update using (addressee_id = auth.uid() or requester_id = auth.uid())
  with check (addressee_id = auth.uid() or requester_id = auth.uid());

create policy "either party removes the friendship" on friendships
  for delete using (requester_id = auth.uid() or addressee_id = auth.uid());

alter table event_rsvps enable row level security;

create policy "rsvp visible to self, owner, consenting friends" on event_rsvps
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from events e
      where e.id = event_rsvps.event_id and owns_restaurant(e.restaurant_id)
    )
    or (
      is_accepted_friend(auth.uid(), student_id)
      and shares_activity(student_id)
    )
  );

create policy "student rsvps for self" on event_rsvps
  for insert with check (student_id = auth.uid());

create policy "student removes own rsvp" on event_rsvps
  for delete using (student_id = auth.uid());

-- Friends can see each other's name and hostel in lists.
create policy "friends read each other" on users
  for select using (is_accepted_friend(auth.uid(), id));

-- Friend requests need the requester/addressee name visible to the other party
-- even before acceptance.
create policy "friendship parties read each other" on users
  for select using (
    exists (
      select 1 from friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = users.id)
         or (f.addressee_id = auth.uid() and f.requester_id = users.id)
    )
  );

-- Finding a friend by exact institute email without exposing the users table.
create function find_student_by_email(lookup_email text)
returns table (id uuid, full_name text, hostel text)
language sql stable security definer set search_path = public as $$
  select u.id, u.full_name, u.hostel
  from users u
  where lower(u.email) = lower(lookup_email)
    and u.role = 'student'
    and u.id <> auth.uid()
    and auth.uid() is not null;
$$;
