import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileViewLogger } from '@/components/features/ProfileViewLogger';
import { RestaurantCard } from '@/components/features/RestaurantCard';
import { ReviewForm } from '@/components/features/ReviewForm';
import { ReviewList } from '@/components/features/ReviewList';
import { SaveToggle } from '@/components/features/SaveToggle';
import { DestinyPage } from '@/components/ui/DestinyPage';
import { VIBES } from '@/config/vibes';
import { getSessionUser } from '@/lib/auth/session';
import { canReview } from '@/lib/domain/booking';
import { formatDistance, haversineKm } from '@/lib/domain/distance';
import {
  formatDayShifts,
  type DayKey,
  type OpeningHours,
} from '@/lib/domain/hours';
import { listStudentBookings } from '@/lib/queries/bookings';
import { alsoLike, getRestaurantDetail } from '@/lib/queries/catalog';
import { getSavedIds } from '@/lib/queries/social';
import {
  ProfileCoverCarousel,
  ProfileGalleryButton,
  ProfileMenuButton,
} from './RestaurantProfileClient';
import styles from './restaurant.module.css';

const NITW_CAMPUS = { lat: 17.9833, lng: 79.5308 };
const DETAIL_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};
const PHOTO_LABELS = ['Cover', 'Food', 'Interior', 'Ambience', 'Kitchen'];

export async function generateMetadata(
  props: PageProps<'/restaurant/[id]'>,
): Promise<Metadata> {
  const { id } = await props.params;
  const detail = await getRestaurantDetail(id);
  return { title: detail?.row.name ?? 'Restaurant' };
}

export default async function RestaurantPage(
  props: PageProps<'/restaurant/[id]'>,
) {
  const { id } = await props.params;
  const search = await props.searchParams;
  const [detail, user, savedIds, bookings] = await Promise.all([
    getRestaurantDetail(id),
    getSessionUser(),
    getSavedIds(),
    listStudentBookings(),
  ]);
  if (!detail) notFound();

  const { summary, row, menu, menuPhotos, offers, events, reviews } = detail;
  const artwork = DETAIL_ARTWORK[row.name];
  const photos = artwork
    ? [artwork, ...summary.photos.filter((photo) => photo !== artwork)]
    : summary.photos;
  const isStudent = user?.role === 'student';
  const distance =
    summary.lat !== null && summary.lng !== null
      ? formatDistance(
          haversineKm(
            NITW_CAMPUS.lat,
            NITW_CAMPUS.lng,
            summary.lat,
            summary.lng,
          ),
        )
      : row.area;
  const hours = row.opening_hours as OpeningHours | null;
  const todayKey = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' })
    .toLowerCase() as DayKey;
  const todayHours = hours ? formatDayShifts(hours[todayKey]) : 'Not listed';
  const cuisine =
    summary.cravingTags.slice(0, 2).join(' · ') ||
    row.vibe_tags
      .slice(0, 2)
      .map((tag) => VIBES.find((vibe) => vibe.tag === tag)?.label ?? tag)
      .join(' · ') ||
    'Local favourite';
  const address = row.address || row.area;
  const reviewableBooking = isStudent
    ? bookings.find(
        (booking) =>
          booking.restaurant_id === id &&
          canReview(booking) &&
          !booking.alreadyReviewed,
      )
    : undefined;

  return (
    <DestinyPage className={styles.restaurantPage}>
      <ProfileViewLogger
        restaurantId={id}
        source={typeof search.from === 'string' ? search.from : 'direct'}
      />
      <div className={styles.shell}>
        <header className={styles.profileHead}>
          <div className={styles.cover}>
            <Link
              href="/"
              className={styles.backLink}
              aria-label="Back to home"
            >
              <BackIcon />
            </Link>
            <div className={styles.coverActions}>
              {photos.length > 0 ? (
                <ProfileGalleryButton
                  photos={photos}
                  restaurantName={row.name}
                  labels={PHOTO_LABELS}
                />
              ) : null}
              <SaveToggle
                restaurantId={id}
                initialSaved={isStudent && savedIds.has(id)}
              />
            </div>
            <ProfileCoverCarousel
              photos={photos.slice(0, 4)}
              restaurantName={row.name}
            />
            <div className={styles.coverShade} aria-hidden />
          </div>
          <div className={styles.headBox}>
            <div className={styles.titleLine}>
              <div className={styles.nameGroup}>
                <div className={styles.nameRow}>
                  <h1>{row.name}</h1>
                </div>
                <p className={styles.cuisineLine}>{cuisine}</p>
                <p className={styles.locationLine}>
                  <span className={styles.addressLine}>
                    <PinIcon />
                    <span>{address}</span>
                  </span>
                  <span className={styles.distancePill}>{distance}</span>
                </p>
              </div>
              <div className={styles.ratingStack}>
                <strong
                  className={styles.ratingValue}
                  aria-label="Restaurant rating"
                >
                  <StarIcon />
                  {summary.rating?.toFixed(1) ?? 'New'}
                </strong>
              </div>
            </div>
            <div className={styles.headFooter}>
              <p className={styles.openingTime}>
                <ClockIcon />
                <span>Today</span>
                <strong>{todayHours}</strong>
              </p>
              <ProfileMenuButton
                restaurantName={row.name}
                items={menu.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                }))}
                menuPhotos={menuPhotos}
              />
            </div>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="offers-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="offers-title">Special Offers</h2>
            </div>
          </div>
          {offers[0] ? (
            <article className={styles.offerCard}>
              <div className={styles.offerTopline}>
                <span className={styles.offerKicker}>Live now</span>
                <time dateTime={offers[0].starts_at}>
                  {formatOfferWindow(offers[0].starts_at, offers[0].expires_at)}
                </time>
              </div>
              <strong>{offers[0].discount_text || offers[0].title}</strong>
              {offers[0].discount_text ? <p>{offers[0].title}</p> : null}
              {offers[0].description ? (
                <div className={styles.offerBody}>{offers[0].description}</div>
              ) : null}
            </article>
          ) : (
            <p className={styles.emptyLine}>
              No special offers running right now.
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="events-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="events-title">Upcoming Events</h2>
            </div>
          </div>
          {events.length ? (
            <div className={styles.eventList}>
              {events.map((event) => (
                <article
                  key={event.id}
                  className={styles.eventCard}
                  data-event-type={event.event_type}
                >
                  <div className={styles.eventTopline}>
                    <span className={styles.eventTypePill}>
                      {formatEventType(event.event_type)}
                    </span>
                    <time dateTime={event.starts_at}>
                      {formatEventDate(event.starts_at)}
                    </time>
                  </div>
                  <strong>{event.title}</strong>
                  <p>{event.description}</p>
                  <div className={styles.eventFooter}>
                    <span>
                      {event.ends_at
                        ? `Until ${formatEventTime(event.ends_at)}`
                        : 'Starts soon'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyLine}>
              Nothing scheduled yet. Check back soon.
            </p>
          )}
        </section>

        <section
          className={`${styles.section} ${styles.reviewsSection}`}
          aria-labelledby="reviews-title"
        >
          <h2 id="reviews-title">Reviews</h2>
          {reviewableBooking ? (
            <div className={styles.writeReview}>
              <span>You visited this place.</span>
              <ReviewForm
                bookingId={reviewableBooking.id}
                restaurantName={row.name}
              />
            </div>
          ) : null}
          <ReviewList
            appearance="destiny"
            reviews={reviews.map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              created_at: review.created_at,
              reviewerName: 'NITW Diner',
            }))}
          />
        </section>

        <RecommendedRestaurants id={id} />
      </div>
      <aside
        className={styles.profileDock}
        aria-label="Restaurant quick actions"
      >
        <Link href={`/restaurant/${id}/book`}>Reserve</Link>
      </aside>
    </DestinyPage>
  );
}

async function RecommendedRestaurants({ id }: { id: string }) {
  const restaurants = await alsoLike(id);
  if (!restaurants.length) return null;
  return (
    <section
      className={`${styles.section} ${styles.similarSection}`}
      aria-labelledby="recommended-title"
    >
      <h2 id="recommended-title">Recommended</h2>
      <div className={styles.similarGrid}>
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={withArtwork(restaurant)}
            source="similar"
          />
        ))}
      </div>
    </section>
  );
}

function withArtwork<T extends { name: string; photos: string[] }>(
  restaurant: T,
): T {
  const artwork = DETAIL_ARTWORK[restaurant.name];
  return artwork
    ? {
        ...restaurant,
        photos: [
          artwork,
          ...restaurant.photos.filter((photo) => photo !== artwork),
        ],
      }
    : restaurant;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m10 6-6 6 6 6" />
      <path d="M5 12h14" />
    </svg>
  );
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}
function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function formatOfferWindow(startsAt: string, expiresAt: string) {
  const start = new Date(startsAt);
  const end = new Date(expiresAt);
  const now = new Date();
  const active = now >= start && now <= end;

  if (active) {
    return `Live ${start.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })} – ${end.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })}`;
  }

  return `${start.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })} – ${end.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })}`;
}

function formatEventType(eventType: string) {
  switch (eventType) {
    case 'live_music':
      return 'Live music';
    case 'open_mic':
      return 'Open mic';
    case 'quiz':
      return 'Quiz night';
    case 'screening':
      return 'Screening';
    case 'food_festival':
      return 'Food festival';
    default:
      return 'Event';
  }
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13L3.1 9.28l6.15-.9L12 2.8Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
