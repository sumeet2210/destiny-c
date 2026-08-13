import Link from 'next/link';
import { Manrope } from 'next/font/google';
import { Suspense } from 'react';
import { CravingExplorer } from '@/components/features/CravingExplorer';
import { RestaurantGrid } from '@/components/features/RestaurantGrid';
import { SpecialsTicker } from '@/components/features/SpecialsTicker';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { SaveToggle } from '@/components/features/SaveToggle';
import { getSessionUser } from '@/lib/auth/session';
import {
  applyFilters,
  listRestaurantSummaries,
  listTickerOffers,
  listUpcomingEvents,
} from '@/lib/queries/catalog';
import type { RestaurantSummary } from '@/lib/queries/catalog';
import { getFriendActivity, getSavedIds } from '@/lib/queries/social';
import styles from './home.module.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-destiny-home',
});

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
      ? {
          ...restaurant,
          photos: [artwork, ...restaurant.photos.slice(1)],
        }
      : restaurant;
  });
}

export default function HomePage() {
  return (
    <main id="top" className={`${styles.home} ${manrope.variable}`}>
      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/hero-campus-feast.webp"
              alt="Biryani, chai and momos arranged for a shared dinner"
              fetchPriority="high"
            />
          </div>

          <div className={styles.heroCopy}>
            <div className={styles.heroLogo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/destiny-wordmark.png" alt="Destiny" />
            </div>
            <h1 id="home-title">Where should we eat?</h1>
            <p>Current offers, nearby events, and places worth the walk.</p>
            <a href="#restaurants" className={styles.primaryAction}>
              Find your perfect spot <DownIcon />
            </a>
            <Link href="/quiz" className={styles.secondaryAction}>
              <TuneIcon /> Try the 3-tap match
            </Link>
          </div>
        </section>

        <Suspense fallback={<HomeSkeleton className={styles.tickerSkeleton} />}>
          <TickerSection />
        </Suspense>

        <SearchSection />

        <Suspense
          fallback={
            <div className={styles.popularSkeletons}>
              {[...Array(3)].map((_, i) => (
                <HomeSkeleton key={i} className={styles.cardSkeleton} />
              ))}
            </div>
          }
        >
          <PopularSection />
        </Suspense>

        <Suspense
          fallback={<HomeSkeleton className={styles.cravingSkeleton} />}
        >
          <CravingSection />
        </Suspense>

        <Suspense fallback={null}>
          <SquadSection />
        </Suspense>

        <HomeFooter />
      </div>
    </main>
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
      <h2 id="specials-title" className="sr-only">
        Current offers and upcoming events
      </h2>
      <SpecialsTicker
        offers={offers.map((o) => ({
          id: o.id,
          restaurant_id: o.restaurant_id,
          restaurantName: o.restaurantName,
          title: o.title,
          discount_text: o.discount_text,
          expires_at: o.expires_at,
          image:
            HOME_ARTWORK[o.restaurantName] ?? '/home/hero-campus-feast.webp',
        }))}
        events={events.slice(0, 6).map((event) => ({
          id: event.id,
          restaurant_id: event.restaurant_id,
          restaurantName: event.restaurantName,
          title: event.title,
          event_type: event.event_type,
          starts_at: event.starts_at,
          image:
            HOME_ARTWORK[event.restaurantName] ??
            '/home/hero-campus-feast.webp',
        }))}
      />
      <Link href="/events" className={styles.railAction}>
        Explore all <ArrowIcon />
      </Link>
    </section>
  );
}

function SearchSection() {
  return (
    <section className={styles.searchSection} aria-labelledby="search-title">
      <div>
        <h2 id="search-title">Know what you want?</h2>
        <p>Search a dish, restaurant, or craving.</p>
      </div>
      <form action="/search" method="get" className={styles.searchPrompt}>
        <SearchIcon />
        <input
          type="search"
          name="q"
          aria-label="Search restaurants and dishes"
          placeholder="Try biryani, chai, rooftop..."
        />
        <button
          type="submit"
          className={styles.searchArrow}
          aria-label="Search"
        >
          <ArrowIcon />
        </button>
      </form>
    </section>
  );
}

async function CravingSection() {
  const restaurants = await listRestaurantSummaries();
  return (
    <section
      id="cravings"
      aria-labelledby="cravings-title"
      className={styles.cravingSection}
    >
      <div className={styles.sectionHeading}>
        <div>
          <h2 id="cravings-title">What are you craving?</h2>
          <p>Pick one. Pass quickly. Open the place that feels right.</p>
        </div>
        <Link href="/search">
          Refine the shortlist <TuneIcon />
        </Link>
      </div>
      <CravingExplorer restaurants={withHomeArtwork(restaurants)} />
    </section>
  );
}

/**
 * P9-6: "Where the squad's going" — friends' event plans and saves. Renders
 * only when there is real friend data; otherwise the honest view-velocity
 * "Popular this week" below carries the homepage.
 */
async function SquadSection() {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') return null;
  const activity = await getFriendActivity();
  if (activity.goingTo.size === 0 && activity.savedBy.size === 0) return null;

  const events = (await listUpcomingEvents()).filter((e) =>
    activity.goingTo.has(e.id),
  );

  return (
    <section aria-labelledby="squad-title" className={styles.squadSection}>
      <div className={styles.sectionHeading}>
        <div>
          <h2 id="squad-title">Where the squad&apos;s going</h2>
          <p>Only activity your friends have chosen to share appears here.</p>
        </div>
        <Link href="/friends">
          Friends <ArrowIcon />
        </Link>
      </div>
      {events.length === 0 ? (
        <p className={styles.emptyNote}>
          Friends have saved places below — look for their names on the cards.
        </p>
      ) : (
        <div className={styles.squadGrid}>
          {events.map((e) => {
            const names = activity.goingTo.get(e.id)!;
            return (
              <EventCard
                key={e.id}
                className={styles.eventCard}
                title={e.title}
                eventType={e.event_type}
                startsAt={e.starts_at}
                restaurantName={e.restaurantName}
                restaurantId={e.restaurant_id}
                rsvpSlot={
                  <span className={styles.friendSignal}>
                    {names.length === 1
                      ? `${names[0]} is going`
                      : `${names[0]} + ${names.length - 1} more going`}
                  </span>
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

async function PopularSection() {
  // Honest label (build plan Phase 9): this is view velocity, not friend
  // activity — the squad section above carries the real friend data.
  const [summaries, savedIds, activity, user] = await Promise.all([
    listRestaurantSummaries(),
    getSavedIds(),
    getFriendActivity(),
    getSessionUser(),
  ]);
  const restaurants = withHomeArtwork(
    applyFilters(summaries, { sort: 'trending' }),
  ).slice(0, 3);
  const isStudent = user?.role === 'student';

  const saveSlots = isStudent
    ? Object.fromEntries(
        restaurants.map((r) => [
          r.id,
          <SaveToggle
            key={r.id}
            restaurantId={r.id}
            initialSaved={savedIds.has(r.id)}
          />,
        ]),
      )
    : undefined;
  const friendNotes = Object.fromEntries(
    [...activity.savedBy.entries()].map(([id, names]) => [
      id,
      names.length === 1
        ? `${names[0]} saved this`
        : `${names.length} friends saved this`,
    ]),
  );

  return (
    <section
      id="restaurants"
      aria-labelledby="popular-title"
      className={styles.popularSection}
    >
      <div className={styles.popularHeading}>
        <div>
          <h2 id="popular-title">Restaurants for you</h2>
          <p>Popular nearby places, kept compact for a quick decision.</p>
        </div>
        <Link href="/search">
          Browse all places <ArrowIcon />
        </Link>
      </div>
      <RestaurantGrid
        restaurants={restaurants}
        source="homepage_feed"
        saveSlots={saveSlots}
        friendNotes={friendNotes}
      />
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <Link href="/" aria-label="Destiny home" className={styles.footerLogo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/destiny-wordmark.png" alt="Destiny" />
      </Link>
      <p>Decide where to eat, without the endless feed.</p>
      <a href="#top">
        Back to top <ArrowIcon />
      </a>
    </footer>
  );
}

function HomeSkeleton({ className }: { className: string }) {
  return <Skeleton className={className} />;
}

function ArrowIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function TuneIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
    </svg>
  );
}
