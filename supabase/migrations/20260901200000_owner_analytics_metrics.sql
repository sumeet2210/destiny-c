create or replace function public.owner_saved_restaurant_count(
  target_restaurant_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.saved_restaurants saved
  where saved.restaurant_id = target_restaurant_id
    and public.owns_restaurant(target_restaurant_id);
$$;

revoke all on function public.owner_saved_restaurant_count(uuid) from public;
grant execute on function public.owner_saved_restaurant_count(uuid) to authenticated;
