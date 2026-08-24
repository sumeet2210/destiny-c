import { RestaurantStatusControls } from '@/components/features/admin/AdminControls';
import {
  Empty,
  FilterLink,
  NotConfigured,
  StatusPill,
} from '@/components/features/admin/AdminUi';
import { Card } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import {
  listAdminRestaurants,
  type RestaurantStatus,
} from '@/lib/queries/admin';

export const metadata = { title: 'Restaurants · Admin' };

const FILTERS = [
  { status: 'pending_approval', label: 'Pending' },
  { status: 'active', label: 'Active' },
  { status: 'suspended', label: 'Suspended' },
] as const;

const isStatus = (v: unknown): v is RestaurantStatus =>
  FILTERS.some((f) => f.status === v);

export default async function AdminRestaurantsPage(
  props: PageProps<'/admin/restaurants'>,
) {
  const searchParams = await props.searchParams;
  // An unrecognised ?status= is treated as "All" rather than passed through to
  // the query.
  const status = isStatus(searchParams.status)
    ? searchParams.status
    : undefined;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Heading />
        <NotConfigured />
      </>
    );
  }

  const restaurants = await listAdminRestaurants(status);

  return (
    <>
      <Heading />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <FilterLink
            key={f.status}
            href={`/admin/restaurants?status=${f.status}`}
            active={status === f.status}
          >
            {f.label}
          </FilterLink>
        ))}
        <FilterLink href="/admin/restaurants" active={!status}>
          All
        </FilterLink>
      </div>

      {restaurants.length === 0 ? (
        <Empty>No restaurants match this filter.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-paper font-semibold">{r.name}</h2>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="text-text-muted text-sm">
                      {r.area}
                      {r.address ? ` · ${r.address}` : ''}
                      {r.phone ? ` · ${r.phone}` : ''}
                    </p>
                    <p className="text-text-muted text-xs">
                      Owner: {r.owner?.full_name ?? '—'}
                      {r.owner?.email ? ` (${r.owner.email})` : ''}
                    </p>
                  </div>
                  <RestaurantStatusControls id={r.id} status={r.status} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Heading() {
  return (
    <h1 className="font-display text-paper mb-4 text-xl font-extrabold">
      Restaurants
    </h1>
  );
}
