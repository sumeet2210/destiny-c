import Link from 'next/link';
import { Suspense } from 'react';
import type { Viewport } from 'next';
import { FilterBar } from '@/components/features/FilterBar';
import { RestaurantGrid } from '@/components/features/RestaurantGrid';
import { MenuRow } from '@/components/ui/MenuRow';
import { Card } from '@/components/ui/Card';
import { DestinyPage } from '@/components/ui/DestinyPage';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  applyFilters,
  listRestaurantSummaries,
  searchDishes,
  type CatalogFilters,
  type RestaurantSummary,
} from '@/lib/queries/catalog';
import styles from './search.module.css';

export const metadata = { title: 'Search' };

export const viewport: Viewport = {
  themeColor: '#F8FAFA',
};

const SEARCH_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};

const str = (value: string | string[] | undefined) =>
  typeof value === 'string' && value !== '' ? value : undefined;

function withSearchArtwork(restaurants: RestaurantSummary[]) {
  return restaurants.map((restaurant) => {
    const artwork = SEARCH_ARTWORK[restaurant.name];
    return artwork
      ? { ...restaurant, photos: [artwork, ...restaurant.photos.slice(1)] }
      : restaurant;
  });
}

export default async function SearchPage(props: PageProps<'/search'>) {
  const searchParams = await props.searchParams;

  const filters: CatalogFilters = {
    q: str(searchParams.q),
    craving: str(searchParams.craving),
    veg: str(searchParams.veg) as CatalogFilters['veg'],
    openNow: searchParams.open === '1',
    hasOffer: searchParams.offer === '1',
    price: str(searchParams.price),
    area: str(searchParams.area),
    vibe: str(searchParams.vibe),
    discount: searchParams.discount === '1',
    ac: str(searchParams.ac) as CatalogFilters['ac'],
    service: str(searchParams.service) as CatalogFilters['service'],
    minRating: str(searchParams.rating)
      ? Number(searchParams.rating)
      : undefined,
    sort: (str(searchParams.sort) as CatalogFilters['sort']) ?? 'trending',
  };
  const cameFromQuiz = searchParams.from === 'quiz';

  return (
    <DestinyPage className={styles.searchPage}>
      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="search-title">
          <h1 id="search-title">Find a spot.</h1>
          <div className={styles.introCopy}>
            <p>
              Search the dish you want, then narrow the shortlist with the
              details that matter right now.
            </p>
            <Link href="/quiz" className={styles.matchLink}>
              Not sure? Get matched <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className={styles.filterPanel} aria-label="Search filters">
          <Suspense fallback={<Skeleton className={styles.filterSkeleton} />}>
            <FilterBar />
          </Suspense>
        </section>

        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={<ResultsSkeleton />}
        >
          <Results filters={filters} cameFromQuiz={cameFromQuiz} />
        </Suspense>
      </div>
    </DestinyPage>
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
  const [rawSummaries, dishHits] = await Promise.all([
    listRestaurantSummaries(),
    filters.q ? searchDishes(filters.q) : Promise.resolve([]),
  ]);
  const summaries = withSearchArtwork(rawSummaries);
  const results = applyFilters(summaries, filters);

  // Dish results can introduce a restaurant even when its name does not match.
  const resultIds = new Set(results.map((restaurant) => restaurant.id));
  const dishOnlyRestaurants = withSearchArtwork(
    dishHits
      .map((hit) => hit.restaurant)
      .filter(
        (restaurant, index, list) =>
          list.findIndex((candidate) => candidate.id === restaurant.id) ===
          index,
      )
      .filter((restaurant) => !resultIds.has(restaurant.id)),
  );

  if (results.length === 0 && dishHits.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>Nothing matches that combination.</h2>
        <p>
          Clear a filter or try a broader dish name to reopen the shortlist.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.results}>
      {dishHits.length > 0 && (
        <section className={styles.dishSection} aria-labelledby="dish-title">
          <div>
            <h2 id="dish-title">Dishes matching &ldquo;{filters.q}&rdquo;</h2>
            <p>Menu matches can lead to places whose name does not.</p>
          </div>
          <Card className={styles.dishList}>
            {dishHits.slice(0, 10).map((hit) => (
              <Link
                key={hit.item.id}
                href={`/restaurant/${hit.restaurant.id}?from=search`}
                className={styles.dishLink}
              >
                <MenuRow
                  name={hit.item.name}
                  price={hit.item.price}
                  isVeg={hit.item.is_veg}
                  appearance="destiny"
                />
                <p>
                  at {hit.restaurant.name} · {hit.restaurant.area}
                </p>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {(results.length > 0 || dishOnlyRestaurants.length > 0) && (
        <section
          className={styles.restaurantSection}
          aria-labelledby="restaurant-results-title"
        >
          <div className={styles.resultsHeading}>
            <h2 id="restaurant-results-title">
              {filters.q
                ? 'Restaurants'
                : `${results.length} spot${results.length === 1 ? '' : 's'}`}
            </h2>
            <p>Open one when the place, price, and plan feel right.</p>
          </div>
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

function ResultsSkeleton() {
  return (
    <div className={styles.resultsSkeleton} aria-hidden>
      <div className={styles.resultsSkeletonHeading} />
      <div className={styles.resultsSkeletonGrid}>
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} className={styles.cardSkeleton} />
        ))}
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
