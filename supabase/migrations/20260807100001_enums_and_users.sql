-- P1-1: enums + users + RLS. RLS ships in the same migration as the table, always.

create type user_role as enum ('student', 'owner', 'admin');
create type restaurant_status as enum ('pending_approval', 'active', 'suspended');
create type booking_status as enum ('requested', 'confirmed', 'unconfirmed', 'completed', 'cancelled');
create type photo_kind as enum ('gallery', 'menu_photo');
create type event_type as enum ('live_music', 'open_mic', 'quiz', 'screening', 'food_festival', 'other');
create type friendship_status as enum ('pending', 'accepted', 'blocked');

create table users (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            user_role not null default 'student',
  full_name       text,
  email           text unique not null,
  hostel          text,
  nitw_verified   boolean not null default false,
  no_show_count   int not null default 0,
  share_activity  boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table users enable row level security;

create policy "users read own row" on users
  for select using (id = auth.uid());

create policy "users update own profile" on users
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Row is created by a trigger on auth.users, not by the client.
create function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Second-layer NITW domain check (first layer is the /login route).
-- PRD §8 / config/auth.ts: placeholder domain, update both together.
create function is_nitw_student_email(email text)
returns boolean language sql immutable as $$
  select lower(email) like '%@student.nitw.ac.in';
$$;
