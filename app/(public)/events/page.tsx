import { Suspense } from 'react';
import Link from 'next/link';
import { DestinyPage } from '@/components/ui/DestinyPage';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  listEventInterestCounts,
  listUpcomingEvents,
} from '@/lib/api/events';
import { EventsExplorer, type SceneEvent } from './EventsExplorer';
import styles from './events.module.css';

export const metadata = {
  title: 'The Scene',
  description: 'Discover what is happening around NIT Warangal.',
};

const RESTAURANT_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
  "Hunter's Grill": '/home/hero-campus-feast.webp',
};

function eventArtwork(restaurantName: string, coverImageUrl: string | null) {
  if (coverImageUrl && !coverImageUrl.startsWith('/seed/')) {
    return coverImageUrl;
  }
  return RESTAURANT_ARTWORK[restaurantName] ?? '/home/hero-campus-feast.webp';
}

function heroDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export default async function EventsPage() {
  const heroEvents = (await listUpcomingEvents()).slice(0, 2);

  return (
    <DestinyPage className={styles.eventsPage}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <h1>
            <span>The</span>
            <span>Scene</span>
          </h1>
          <p className={styles.heroSubtitle}>
            What&apos;s happening around NITW?
          </p>
        </div>
        {heroEvents.length ? (
          <div
            className={styles.heroDeck}
            aria-label="Upcoming event highlights"
          >
            {heroEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={styles.heroPoster}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={eventArtwork(
                    event.restaurantName,
                    event.cover_image_url,
                  )}
                  alt=""
                />
                <span>{heroDate(event.starts_at)}</span>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.restaurantName}</small>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <div className={styles.shell}>
        <Suspense fallback={<EventsLoading />}>
          <EventsData />
        </Suspense>
      </div>
    </DestinyPage>
  );
}

async function EventsData() {
  const [events, interestCounts] = await Promise.all([
    listUpcomingEvents(),
    listEventInterestCounts(),
  ]);

  if (!events.length) {
    return (
      <section className={styles.emptyState}>
        <p className={styles.sectionKicker}>The Scene</p>
        <h2>Quiet for now. Not for long.</h2>
        <p>
          Restaurants are lining up their next drops. Check back before the
          weekend or browse places around campus now.
        </p>
        <a href="/search">Browse restaurants</a>
      </section>
    );
  }

  const sceneEvents: SceneEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.event_type,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    restaurantId: event.restaurant_id,
    restaurantName: event.restaurantName,
    area: 'Near NIT Warangal',
    artwork: eventArtwork(event.restaurantName, event.cover_image_url),
    entryFee: event.entry_fee,
    location: event.location_details,
    ticketUrl: event.ticket_url,
    interestCount: interestCounts.get(event.id) ?? 0,
  }));

  return (
    <EventsExplorer
      events={sceneEvents}
      rangeStart={new Date().toISOString()}
    />
  );
}

function EventsLoading() {
  return (
    <div className={styles.loadingState} aria-label="Loading The Scene">
      <Skeleton className={styles.dateSkeleton} />
      <div className={styles.loadingHeading}>
        <Skeleton />
        <Skeleton />
      </div>
      <div className={styles.loadingRail}>
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} />
        ))}
      </div>
    </div>
  );
}
