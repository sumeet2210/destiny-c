import { Suspense } from 'react';
import { LiveTickerSearch } from '@/components/features/LiveTickerSearch';
import { SpecialsTicker } from '@/components/features/SpecialsTicker';
import { SquadGoingSection } from '@/components/features/SquadGoingSection';
import { Skeleton } from '@/components/ui/Skeleton';
import { getSessionUser } from '@/lib/auth/session';
import {
  applyFilters,
  listQuickSearchIndex,
  listRestaurantSummaries,
  listTickerOffers,
  listUpcomingEvents,
  type RestaurantSummary,
} from '@/lib/queries/catalog';
import { getSavedIds } from '@/lib/queries/social';
import { HeroRotatingCta } from './HeroRotatingCta';
import styles from './home.module.css';

const HOME_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};

function withHomeArtwork(restaurants: RestaurantSummary[]) {
  return restaurants.map((restaurant) => {
    const artwork = HOME_ARTWORK[restaurant.name];
    return artwork
      ? { ...restaurant, photos: [artwork, ...restaurant.photos.slice(1)] }
      : restaurant;
  });
}

export default function HomePage() {
  return (
    <main id="top" className={styles.home}>
      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <div className={styles.heroLogo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/destiny-logo-transparent.png" alt="Destiny" />
            </div>
            <h1 id="home-title" className="sr-only">
              Find a restaurant with Destiny
            </h1>
            <p className={styles.heroTagline}>
              <strong>NITW</strong>, this one&apos;s for you
            </p>
            <HeroRotatingCta />
          </div>
        </section>

        <Suspense fallback={<HomeSkeleton className={styles.tickerSkeleton} />}>
          <TickerSection />
        </Suspense>

        <Suspense fallback={<HomeSkeleton className={styles.searchSkeleton} />}>
          <HomeSearchSection />
        </Suspense>

        <Suspense
          fallback={<HomeSkeleton className={styles.discoverSkeleton} />}
        >
          <DiscoverSection />
        </Suspense>
      </div>
    </main>
  );
}

async function DiscoverSection() {
  const [restaurants, user, savedIds] = await Promise.all([
    listRestaurantSummaries(),
    getSessionUser(),
    getSavedIds(),
  ]);

  return (
    <SquadGoingSection
      className={styles.homeSquadSection}
      restaurants={withHomeArtwork(
        applyFilters(restaurants, { sort: 'trending' }),
      )}
      loggedIn={user?.role === 'student'}
      initialSavedIds={[...savedIds]}
    />
  );
}

async function HomeSearchSection() {
  const searchIndex = await listQuickSearchIndex();

  return (
    <section
      className={styles.homeSearchSection}
      aria-label="Find a restaurant or dish"
    >
      <LiveTickerSearch index={searchIndex} className={styles.homeSearch} />
    </section>
  );
}

async function TickerSection() {
  const [offers, events] = await Promise.all([
    listTickerOffers(),
    listUpcomingEvents(),
  ]);

  return (
    <section
      id="specials"
      aria-labelledby="specials-title"
      className={styles.specialsSection}
    >
      <h2 id="specials-title" className={styles.tickerHeading}>
        Catch It Before It&apos;s Gone
      </h2>
      <SpecialsTicker
        offers={offers.map((offer) => ({
          id: offer.id,
          restaurant_id: offer.restaurant_id,
          restaurantName: offer.restaurantName,
          restaurantLat: offer.restaurantLat,
          restaurantLng: offer.restaurantLng,
          title: offer.title,
          discount_text: offer.discount_text,
          expires_at: offer.expires_at,
          image:
            HOME_ARTWORK[offer.restaurantName] ??
            '/home/hero-campus-feast.webp',
        }))}
        events={events.slice(0, 6).map((event) => ({
          id: event.id,
          restaurant_id: event.restaurant_id,
          restaurantName: event.restaurantName,
          restaurantLat: event.restaurantLat,
          restaurantLng: event.restaurantLng,
          title: event.title,
          event_type: event.event_type,
          starts_at: event.starts_at,
          image:
            HOME_ARTWORK[event.restaurantName] ??
            '/home/hero-campus-feast.webp',
        }))}
      />
    </section>
  );
}

function HomeSkeleton({ className }: { className: string }) {
  return <Skeleton className={className} />;
}
