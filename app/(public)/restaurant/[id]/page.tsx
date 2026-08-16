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
import { ProfileCoverCarousel, ProfileMenu } from './RestaurantProfileClient';
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
                <h1>{row.name}</h1>
                <span
                  className={styles.statusBadge}
                  data-open={summary.isOpen || undefined}
                >
                  {summary.isOpen ? 'Open now' : 'Closed'}
                </span>
              </div>
              <strong
                className={styles.ratingValue}
                aria-label="Restaurant rating"
              >
                <StarIcon />
                {summary.rating?.toFixed(1) ?? 'New'}
              </strong>
            </div>
            <div className={styles.metaRow}>
              <span>{cuisine}</span>
              <span>{distance}</span>
            </div>
            <p className={styles.openingTime}>
              <ClockIcon />
              <span>Today</span>
              <strong>{todayHours}</strong>
            </p>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="gallery-title">
          <h2 id="gallery-title">Gallery</h2>
          {photos.length ? (
            <div className={styles.galleryRail}>
              {photos.map((photo, index) => (
                <figure key={`${photo}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- restaurant storage images are resized on upload. */}
                  <img src={photo} alt="" loading="lazy" />
                  <figcaption>
                    {PHOTO_LABELS[index] ?? `Photo ${index + 1}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className={styles.emptyLine}>
              Photos have not been published yet.
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="menu-title">
          <div className={styles.sectionTitle}>
            <h2 id="menu-title">Menu</h2>
          </div>
          <ProfileMenu
            restaurantName={row.name}
            items={menu.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              isVeg: item.is_veg,
              available: item.is_available,
            }))}
            photos={menuPhotos}
          />
        </section>

        <section className={styles.section} aria-labelledby="about-title">
          <h2 id="about-title">About</h2>
          <p className={styles.description}>
            {row.description ||
              `${row.name} is a neighbourhood favourite for relaxed meals and easy group plans.`}
          </p>
          <div className={styles.infoGrid}>
            <InfoCard
              icon={<ClockIcon />}
              label="Hours today"
              value={todayHours}
            />
            <InfoCard
              icon={<PinIcon />}
              label="Address"
              value={row.address || row.area}
            />
            <InfoCard
              icon={<PhoneIcon />}
              label="Phone"
              value={row.phone || 'Not listed'}
            />
            <InfoCard
              icon={<PlateIcon />}
              label="Service"
              value={
                [row.dine_in && 'Dine-in', row.takeaway && 'Takeaway']
                  .filter(Boolean)
                  .join(' + ') || 'Visit venue'
              }
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="offers-title">
          <h2 id="offers-title">Special Offers</h2>
          {offers[0] ? (
            <article className={styles.offerCard}>
              <strong>{offers[0].discount_text || offers[0].title}</strong>
              {offers[0].discount_text ? <span>{offers[0].title}</span> : null}
              {offers[0].description ? <p>{offers[0].description}</p> : null}
            </article>
          ) : (
            <p className={styles.emptyLine}>
              No special offers running right now.
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="events-title">
          <h2 id="events-title">Upcoming Events</h2>
          {events.length ? (
            <div className={styles.eventList}>
              {events.map((event) => (
                <article key={event.id}>
                  <strong>{event.title}</strong>
                  <time dateTime={event.starts_at}>
                    {formatEventDate(event.starts_at)}
                  </time>
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

        <SimilarRestaurants id={id} />
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

async function SimilarRestaurants({ id }: { id: string }) {
  const restaurants = await alsoLike(id);
  if (!restaurants.length) return null;
  return (
    <section
      className={`${styles.section} ${styles.similarSection}`}
      aria-labelledby="similar-title"
    >
      <h2 id="similar-title">Similar Restaurants</h2>
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.infoCard}>
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
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
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13L3.1 9.28l6.15-.9L12 2.8Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M7 3 4 5c0 8 7 15 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2-3-5Z" />
    </svg>
  );
}
function PlateIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  );
}
