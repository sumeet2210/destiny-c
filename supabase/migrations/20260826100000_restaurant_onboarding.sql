-- Restaurant onboarding now happens before Auth account creation.
-- Existing status values are renamed in place so dependent policies/functions
-- keep their enum OIDs while adopting the new lifecycle language.

alter type restaurant_status rename value 'pending_approval' to 'profile_incomplete';
alter type restaurant_status rename value 'active' to 'live';
alter type restaurant_status add value 'profile_review' after 'profile_incomplete';

create type restaurant_application_status as enum (
  'pending',
  'approved',
  'rejected',
  'more_info_required'
);

create table restaurant_applications (
  id                    uuid primary key default gen_random_uuid(),
  application_id        text not null unique,
  restaurant_name       text not null,
  owner_name            text not null,
  phone                  text not null check (phone ~ '^\+91[0-9]{10}$'),
  email                  text not null,
  restaurant_address    text not null,
  status                restaurant_application_status not null default 'pending',
  access_token_hash     text not null,
  action_token_hash     text,
  action_token_expires_at timestamptz,
  rejection_reason      text,
  more_info_request     text,
  applicant_response    text,
  reviewed_by           uuid references users (id) on delete set null,
  reviewed_at           timestamptz,
  claimed_by            uuid references users (id) on delete set null,
  claimed_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint restaurant_application_email_format
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint restaurant_application_claim_consistency
    check ((claimed_at is null) = (claimed_by is null))
);

-- One open application per email and one open application per restaurant at a
-- given address. Rejected applications remain historical and can be retried.
create unique index restaurant_applications_open_email_idx
  on restaurant_applications (lower(email))
  where status <> 'rejected';

create unique index restaurant_applications_open_restaurant_idx
  on restaurant_applications (lower(restaurant_name), lower(restaurant_address))
  where status <> 'rejected';

create index restaurant_applications_status_created_idx
  on restaurant_applications (status, created_at desc);

alter table restaurant_applications enable row level security;
-- Deliberately no client policies. Public submission/status access is mediated
-- by server actions that validate opaque tokens. Admin reads use service role.

alter table restaurants
  add column application_id uuid unique
    references restaurant_applications (id) on delete restrict,
  add column profile_submitted_at timestamptz,
  add column profile_reviewed_at timestamptz,
  add column activated_at timestamptz;

-- Owners cannot create a restaurant row directly anymore. The service-only
-- claim function in the next migration is the sole creation path.
drop policy if exists "owner inserts own restaurant" on restaurants;

create table restaurant_application_audit (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid references restaurant_applications (id) on delete set null,
  restaurant_id     uuid references restaurants (id) on delete set null,
  admin_user_id     uuid not null references users (id) on delete restrict,
  action            text not null check (
    action in ('approved', 'rejected', 'more_info_requested', 'profile_activated')
  ),
  from_status       text,
  to_status         text not null,
  notes             text,
  created_at        timestamptz not null default now()
);

create index restaurant_application_audit_application_idx
  on restaurant_application_audit (application_id, created_at desc);

create index restaurant_application_audit_restaurant_idx
  on restaurant_application_audit (restaurant_id, created_at desc);

alter table restaurant_application_audit enable row level security;
-- Audit rows are service-role only and never exposed to restaurant owners.
