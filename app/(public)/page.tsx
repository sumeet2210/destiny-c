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
          <div className={styles.heroCopy}>
            <h1 id="home-title">Dinner, minus the group chat.</h1>
            <p>
              Fresh offers, real menus, and nearby places worth leaving the
              hostel for.
            </p>

            <Link href="/search" className={styles.searchPrompt}>
              <SearchIcon />
              <span>Search a dish or place</span>
              <span className={styles.searchArrow} aria-hidden>
                <ArrowIcon />
              </span>
            </Link>

            <div className={styles.heroActions}>
              <a href="#cravings" className={styles.primaryAction}>
                Find dinner <DownIcon />
              </a>
              <Link href="/quiz" className={styles.secondaryAction}>
                <TuneIcon /> 3-tap match
              </Link>
            </div>
          </div>

          <div className={styles.heroMedia}>
            {/* The approved prototype image is a local, production-owned asset. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/hero-campus-feast.webp"
              alt="Biryani, chai and momos arranged for a shared dinner"
              fetchPriority="high"
            />
            <div className={styles.locationBadge}>
              <PinIcon /> Around campus
            </div>
            <div className={styles.heroPanel}>
              <div>
                <span>Tonight&apos;s fast pick</span>
                <h2>Live offers, ready when you are.</h2>
                <p>Current owner updates and full menus in one place.</p>
              </div>
              <a href="#specials" aria-label="Browse today's specials">
                <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        <Suspense fallback={<HomeSkeleton className={styles.tickerSkeleton} />}>
          <TickerSection />
        </Suspense>

        <Suspense
          fallback={<HomeSkeleton className={styles.cravingSkeleton} />}
        >
          <CravingSection />
        </Suspense>

        <Suspense fallback={<HomeSkeleton className={styles.eventSkeleton} />}>
          <EventsPeek />
        </Suspense>

        <Suspense fallback={null}>
          <SquadSection />
        </Suspense>

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

        <HomeFooter />
      </div>
    </main>
  );
}

async function TickerSection() {
  const offers = await listTickerOffers();
  return (
    <section
      id="specials"
      aria-labelledby="specials-title"
      className={styles.specialsSection}
    >
      <div className={styles.sectionHeadingOnDark}>
        <div>
          <h2 id="specials-title">Today&apos;s specials</h2>
          <p>Owner updates stay visible only while they are current.</p>
        </div>
        <Link href="/search?offer=1">
          See every offer <ArrowIcon />
        </Link>
      </div>
      <SpecialsTicker
        offers={offers.map((o) => ({
          id: o.id,
          restaurant_id: o.restaurant_id,
          restaurantName: o.restaurantName,
          title: o.title,
          discount_text: o.discount_text,
          expires_at: o.expires_at,
        }))}
      />
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

async function EventsPeek() {
  const events = await listUpcomingEvents();
  if (events.length === 0) return null;
  const next = events[0];
  return (
    <section aria-labelledby="events-title" className={styles.eventSection}>
      <div className={styles.eventIntro}>
        <span aria-hidden className={styles.eventIcon}>
          <CalendarIcon />
        </span>
        <div>
          <h2 id="events-title">The night can be the plan.</h2>
          <p>Open mics, screenings, and food events live beside the menu.</p>
        </div>
      </div>
      <EventCard
        className={styles.eventCard}
        title={next.title}
        eventType={next.event_type}
        startsAt={next.starts_at}
        restaurantName={next.restaurantName}
        restaurantId={next.restaurant_id}
        description={next.description}
      />
      <Link href="/events" className={styles.eventAction}>
        Explore events <ArrowIcon />
      </Link>
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
    <section aria-labelledby="popular-title" className={styles.popularSection}>
      <div className={styles.popularHeading}>
        <div>
          <h2 id="popular-title">Popular this week</h2>
          <p>A compact view of the places students are opening most.</p>
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

function PinIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className={styles.lineIcon} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}
