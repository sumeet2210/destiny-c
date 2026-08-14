import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { RsvpButton } from '@/components/features/RsvpButton';
import { DestinyPage } from '@/components/ui/DestinyPage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EVENT_TYPES, type EventTypeKey } from '@/config/events';
import { getSessionUser } from '@/lib/auth/session';
import { listUpcomingEvents } from '@/lib/queries/catalog';
import { getFriendActivity, getMyRsvpIds } from '@/lib/queries/social';
import styles from './events.module.css';

export const metadata = { title: 'Events' };

const IST = 'Asia/Kolkata';

const RESTAURANT_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
  "Hunter's Grill": '/home/hero-campus-feast.webp',
};

const typeMeta = (key: string) =>
  EVENT_TYPES.find((type) => type.key === (key as EventTypeKey)) ??
  EVENT_TYPES[EVENT_TYPES.length - 1];

function dateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      timeZone: IST,
    }),
    month: date.toLocaleDateString('en-IN', {
      month: 'short',
      timeZone: IST,
    }),
    weekday: date.toLocaleDateString('en-IN', {
      weekday: 'long',
      timeZone: IST,
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: IST,
    }),
  };
}

function eventArtwork(restaurantName: string, coverImageUrl: string | null) {
  if (coverImageUrl && !coverImageUrl.startsWith('/seed/')) {
    return coverImageUrl;
  }

  return RESTAURANT_ARTWORK[restaurantName] ?? '/home/hero-campus-feast.webp';
}

export default function EventsPage() {
  return (
    <DestinyPage className={styles.eventsPage}>
      <div className={styles.shell}>
        <header className={styles.intro}>
          <div className={styles.introCopy}>
            <h1>What&apos;s on.</h1>
            <p>
              Live music, open mics, screenings and food gatherings from the
              places around campus.
            </p>
          </div>

          <a className={styles.calendarLink} href="#event-list">
            <CalendarIcon />
            <span>See the calendar</span>
            <ArrowDownIcon />
          </a>
        </header>

        <Suspense fallback={<EventsLoading />}>
          <EventsList />
        </Suspense>
      </div>
    </DestinyPage>
  );
}

async function EventsList() {
  const [events, user, myRsvps, activity] = await Promise.all([
    listUpcomingEvents(),
    getSessionUser(),
    getMyRsvpIds(),
    getFriendActivity(),
  ]);
  const isStudent = user?.role === 'student';

  if (events.length === 0) {
    return <EventsEmpty />;
  }

  return (
    <section
      id="event-list"
      className={styles.eventField}
      aria-labelledby="event-list-title"
    >
      <div className={styles.sectionHeading}>
        <h2 id="event-list-title">Upcoming near campus</h2>
        <p>
          {events.length} {events.length === 1 ? 'event' : 'events'} on the
          calendar
        </p>
      </div>

      <div className={styles.eventList}>
        {events.map((event) => {
          const meta = typeMeta(event.event_type);
          const { day, month, weekday, time } = dateParts(event.starts_at);
          const artwork = eventArtwork(
            event.restaurantName,
            event.cover_image_url,
          );
          const artworkStyle = {
            '--event-artwork': `url(${JSON.stringify(artwork)})`,
          } as CSSProperties;

          return (
            <article key={event.id} className={styles.eventCard}>
              <div
                className={styles.eventMedia}
                style={artworkStyle}
                aria-hidden="true"
              >
                <span className={styles.eventType}>{meta.label}</span>
                <time className={styles.dateBlock} dateTime={event.starts_at}>
                  <span>{month}</span>
                  <strong>{day}</strong>
                </time>
              </div>

              <div className={styles.eventContent}>
                <p className={styles.eventTiming}>
                  <CalendarSmallIcon />
                  <span>{weekday}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={event.starts_at}>{time}</time>
                </p>

                <div className={styles.titleRow}>
                  <h3>{event.title}</h3>
                  <div className={styles.rsvpSlot}>
                    <RsvpButton
                      eventId={event.id}
                      initialGoing={myRsvps.has(event.id)}
                      loggedIn={isStudent}
                      friendsGoing={activity.goingTo.get(event.id)}
                    />
                  </div>
                </div>

                {event.restaurantName ? (
                  <p className={styles.venueLine}>
                    At{' '}
                    <Link href={`/restaurant/${event.restaurant_id}`}>
                      {event.restaurantName}
                    </Link>
                  </p>
                ) : null}

                {event.description ? (
                  <p className={styles.description}>{event.description}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EventsLoading() {
  return (
    <section
      id="event-list"
      className={styles.eventField}
      aria-label="Loading upcoming events"
    >
      <div className={styles.sectionHeading}>
        <h2>Upcoming near campus</h2>
        <Skeleton className={styles.countSkeleton} />
      </div>
      <div className={styles.eventList}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className={styles.eventSkeleton}>
            <Skeleton className={styles.mediaSkeleton} />
            <div className={styles.copySkeleton}>
              <Skeleton className={styles.lineShort} />
              <div className={styles.titleSkeletonRow}>
                <Skeleton className={styles.lineTitle} />
                <Skeleton className={styles.actionSkeleton} />
              </div>
              <Skeleton className={styles.lineBody} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventsEmpty() {
  return (
    <section
      id="event-list"
      className={styles.emptyState}
      aria-labelledby="empty-events-title"
    >
      <CalendarIcon />
      <div>
        <h2 id="empty-events-title">The calendar is quiet.</h2>
        <p>
          Nothing is scheduled right now. Restaurants post new events here, so
          check back before the weekend.
        </p>
      </div>
      <Link href="/search" className={styles.browseLink}>
        Browse restaurants
        <ArrowUpRightIcon />
      </Link>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M12 8v7M36 8v7M8 19h32M11 12h26a3 3 0 0 1 3 3v24H8V15a3 3 0 0 1 3-3Z" />
      <path d="m17 29 5 5 10-11" />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M6 14l6 6 6-6" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}
