import Link from 'next/link';
import { Suspense } from 'react';
import { FilterBar } from '@/components/features/FilterBar';
import { RestaurantGrid } from '@/components/features/RestaurantGrid';
import { MenuRow } from '@/components/ui/MenuRow';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  applyFilters,
  listRestaurantSummaries,
  searchDishes,
  type CatalogFilters,
} from '@/lib/queries/catalog';

export const metadata = { title: 'Search' };

const str = (v: string | string[] | undefined) =>
  typeof v === 'string' && v !== '' ? v : undefined;

export default async function SearchPage(props: PageProps<'/search'>) {
  const sp = await props.searchParams;

  const filters: CatalogFilters = {
    q: str(sp.q),
    craving: str(sp.craving),
    veg: str(sp.veg) as CatalogFilters['veg'],
    openNow: sp.open === '1',
    hasOffer: sp.offer === '1',
    price: str(sp.price),
    area: str(sp.area),
    vibe: str(sp.vibe),
    discount: sp.discount === '1',
    ac: str(sp.ac) as CatalogFilters['ac'],
    service: str(sp.service) as CatalogFilters['service'],
    minRating: str(sp.rating) ? Number(sp.rating) : undefined,
    sort: (str(sp.sort) as CatalogFilters['sort']) ?? 'trending',
  };
  const cameFromQuiz = sp.from === 'quiz';

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Find a spot
      </h1>
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <FilterBar />
      </Suspense>
      <Suspense
        key={JSON.stringify(sp)}
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        }
      >
        <Results filters={filters} cameFromQuiz={cameFromQuiz} />
      </Suspense>
    </main>
  );
}

async function Results({
  filters,
  cameFromQuiz,
}: {
  filters: CatalogFilters;
  cameFromQuiz?: boolean;
}) {
  const source = cameFromQuiz
    ? 'quiz'
    : filters.craving
      ? `craving:${filters.craving}`
      : 'search';
  const [summaries, dishHits] = await Promise.all([
    listRestaurantSummaries(),
    filters.q ? searchDishes(filters.q) : Promise.resolve([]),
  ]);
  const results = applyFilters(summaries, filters);

  // Dish-level search (P3-5): also surface restaurants whose menu matches,
  // even if the restaurant name doesn't.
  const resultIds = new Set(results.map((r) => r.id));
  const dishOnlyRestaurants = dishHits
    .map((h) => h.restaurant)
    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
    .filter((r) => !resultIds.has(r.id));

  if (results.length === 0 && dishHits.length === 0) {
    return (
      <div className="rounded-card border-border-hairline bg-surface-muted border p-8 text-center">
        <p className="text-paper text-sm">Nothing matches that combination.</p>
        <p className="text-text-muted mt-1 text-[13px]">
          Try clearing a filter or two — campus isn&apos;t that big yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dishHits.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-paper text-lg font-bold">
            Dishes matching &ldquo;{filters.q}&rdquo;
          </h2>
          <Card>
            {dishHits.slice(0, 10).map((h) => (
              <Link
                key={h.item.id}
                href={`/restaurant/${h.restaurant.id}?from=search`}
                className="hover:bg-surface-raised block"
              >
                <MenuRow
                  name={h.item.name}
                  price={h.item.price}
                  isVeg={h.item.is_veg}
                />
                <p className="text-text-muted -mt-1 pb-1.5 pl-6 text-[11px]">
                  at {h.restaurant.name} · {h.restaurant.area}
                </p>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {(results.length > 0 || dishOnlyRestaurants.length > 0) && (
        <section className="space-y-2">
          <h2 className="font-display text-paper text-lg font-bold">
            {filters.q
              ? 'Restaurants'
              : `${results.length} spot${results.length === 1 ? '' : 's'}`}
          </h2>
          <RestaurantGrid
            restaurants={[...results, ...dishOnlyRestaurants]}
            source={source}
            nearestRequested={filters.sort === 'nearest'}
          />
        </section>
      )}
    </div>
  );
}
