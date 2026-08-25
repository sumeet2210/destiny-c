-- Kept in a second migration because PostgreSQL requires a commit before a
-- newly-added enum value (profile_review) may be referenced.

create function claim_approved_restaurant_application(
  target_application_id uuid,
  target_owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  application restaurant_applications%rowtype;
  restaurant_id uuid;
begin
  select * into application
  from restaurant_applications
  where id = target_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if application.status <> 'approved' then
    raise exception 'Application has not been approved';
  end if;

  if application.claimed_at is not null then
    raise exception 'Application has already been claimed';
  end if;

  insert into restaurants (
    owner_id,
    application_id,
    name,
    owner_name,
    phone,
    area,
    address,
    status
  ) values (
    target_owner_id,
    application.id,
    application.restaurant_name,
    application.owner_name,
    application.phone,
    application.restaurant_address,
    application.restaurant_address,
    'profile_incomplete'
  )
  returning id into restaurant_id;

  update restaurant_applications
  set claimed_by = target_owner_id,
      claimed_at = now(),
      updated_at = now(),
      action_token_hash = null,
      action_token_expires_at = null
  where id = application.id;

  return restaurant_id;
end;
$$;

revoke all on function claim_approved_restaurant_application(uuid, uuid) from public;
revoke all on function claim_approved_restaurant_application(uuid, uuid) from anon;
revoke all on function claim_approved_restaurant_application(uuid, uuid) from authenticated;
grant execute on function claim_approved_restaurant_application(uuid, uuid) to service_role;
