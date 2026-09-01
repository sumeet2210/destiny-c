import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEventTypeLabel } from '@/config/events';
import { getSessionUser } from '@/lib/auth/session';
import { getEventDetail, listEventInterestCounts } from '@/lib/queries/catalog';
import { getFriendActivity, getMyRsvpIds } from '@/lib/queries/social';
import { EventInterestActions } from './EventInterestActions';
import styles from './event-detail.module.css';

const IST = 'Asia/Kolkata';
const ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
  "Hunter's Grill": '/home/hero-campus-feast.webp',
};

function artwork(name: string, source: string | null) {
  return source && !source.startsWith('/seed/')
    ? source
    : (ARTWORK[name] ?? '/home/hero-campus-feast.webp');
}

function longDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: IST,
  });
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
}

export async function generateMetadata({ params }: PageProps<'/events/[id]'>) {
  const { id } = await params;
  const detail = await getEventDetail(id);
  return { title: detail?.event.title ?? 'Event' };
}

export default async function EventDetailPage({
  params,
}: PageProps<'/events/[id]'>) {
  const { id } = await params;
  const [detail, user, myRsvps, activity, counts] = await Promise.all([
    getEventDetail(id),
    getSessionUser(),
    getMyRsvpIds(),
    getFriendActivity(),
    listEventInterestCounts(),
  ]);
  if (!detail) notFound();

  const { event, restaurant, moreEvents } = detail;
  const bookingHref = `/restaurant/${restaurant.id}/book?event=${event.id}`;
  const fee =
    event.entry_fee === 0
      ? 'Free entry'
      : event.entry_fee === null
        ? 'Ask venue for entry details'
        : `₹${event.entry_fee} onwards`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/events" className={styles.backLink}>
          Back to The Scene
        </Link>

        <article className={styles.eventHero}>
          <div className={styles.poster}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artwork(restaurant.name, event.cover_image_url)} alt="" />
            <span>
              {getEventTypeLabel(event.event_type, event.custom_event_type)}
            </span>
          </div>

          <div className={styles.eventCopy}>
            <p className={styles.kicker}>The Scene at {restaurant.name}</p>
            <h1>{event.title}</h1>
            <Link
              href={`/restaurant/${restaurant.id}`}
              className={styles.restaurantLink}
            >
              {restaurant.name}
            </Link>

            <dl className={styles.details}>
              <div>
                <dt>Date</dt>
                <dd>{longDate(event.starts_at)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {time(event.starts_at)}
                  {event.ends_at ? ` – ${time(event.ends_at)}` : ' onwards'}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {event.location_details ??
                    restaurant.address ??
                    restaurant.area}
                </dd>
              </div>
              <div>
                <dt>Entry</dt>
                <dd>{fee}</dd>
              </div>
            </dl>

            {event.description ? (
              <p className={styles.description}>{event.description}</p>
            ) : null}

            <EventInterestActions
              eventId={event.id}
              initialCount={counts.get(event.id) ?? 0}
              initialGoing={myRsvps.has(event.id)}
              loggedIn={user?.role === 'student'}
              friendsGoing={activity.goingTo.get(event.id) ?? []}
              bookingHref={bookingHref}
              ticketUrl={event.ticket_url}
            />
          </div>
        </article>

        <section className={styles.moreSection} aria-labelledby="more-title">
          <div className={styles.moreHeading}>
            <div>
              <p className={styles.kicker}>Keep looking</p>
              <h2 id="more-title">More from this restaurant</h2>
            </div>
            <Link href={`/restaurant/${restaurant.id}`}>View restaurant</Link>
          </div>

          {moreEvents.length ? (
            <div className={styles.moreGrid}>
              {moreEvents.map((item) => (
                <Link key={item.id} href={`/events/${item.id}`}>
                  <span>{longDate(item.starts_at)}</span>
                  <strong>{item.title}</strong>
                  <small>{time(item.starts_at)}</small>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.restaurantFallback}>
              <p>
                That&apos;s the only event announced here right now. The
                restaurant profile has its menu, offers, hours, and booking
                options.
              </p>
              <Link href={`/restaurant/${restaurant.id}`}>
                Open {restaurant.name}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
