import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventCard } from '@/components/features/EventCard';
import { FlagOfferButton } from '@/components/features/FlagOfferButton';
import { OfferBadge } from '@/components/features/OfferBadge';
import { ProfileViewLogger } from '@/components/features/ProfileViewLogger';
import { RestaurantCard } from '@/components/features/RestaurantCard';
import { ReviewList } from '@/components/features/ReviewList';
import { RsvpButton } from '@/components/features/RsvpButton';
import { SaveToggle } from '@/components/features/SaveToggle';
import { ShareButton } from '@/components/features/ShareButton';
import { DestinyPage } from '@/components/ui/DestinyPage';
import { MenuRow } from '@/components/ui/MenuRow';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { VIBES } from '@/config/vibes';
import { getSessionUser } from '@/lib/auth/session';
import {
  DAY_LABELS,
  WEEK,
  formatDayShifts,
  type OpeningHours,
} from '@/lib/domain/hours';
import { alsoLike, getRestaurantDetail } from '@/lib/queries/catalog';
import { getMyRsvpIds, getSavedIds } from '@/lib/queries/social';
import styles from './restaurant.module.css';

const DETAIL_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};

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
  const [detail, user, savedIds, myRsvps] = await Promise.all([
    getRestaurantDetail(id),
    getSessionUser(),
    getSavedIds(),
    getMyRsvpIds(),
  ]);
  if (!detail) notFound();

  const isStudent = user?.role === 'student';
  const { summary, row, menu, menuPhotos, offers, events, reviews } = detail;
  const from = typeof search.from === 'string' ? search.from : 'direct';
  const hours = row.opening_hours as OpeningHours | null;
  const vibeLabel = (tag: string) =>
    VIBES.find((vibe) => vibe.tag === tag)?.label ?? tag;
  const directionsHref =
    summary.lat !== null && summary.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${summary.lat},${summary.lng}`
      : null;
  const artwork = DETAIL_ARTWORK[row.name];
  const heroPhotos = artwork
    ? [artwork, ...summary.photos.filter((photo) => photo !== artwork)]
    : summary.photos;
  const availability = summary.isOpen
    ? summary.closingInMinutes !== null && summary.closingInMinutes <= 45
      ? {
          state: 'closing',
          label: `Closing in ${summary.closingInMinutes}m`,
        }
      : { state: 'open', label: 'Open now' }
    : { state: 'closed', label: 'Closed right now' };

  return (
    <DestinyPage className={styles.restaurantPage}>
      <ProfileViewLogger restaurantId={id} source={from} />

      <div className={styles.shell}>
        <section className={styles.hero} aria-labelledby="restaurant-name">
          <div className={styles.heroMedia}>
            <PhotoCarousel
              photos={heroPhotos}
              alt={row.name}
              aspect="restaurant-detail-hero"
              className={styles.heroCarousel}
              emptyFallback={<PhotoPlaceholderIcon />}
              showControls
            />
          </div>

          <div className={styles.heroContent}>
            <Link href="/search" className={styles.backLink}>
              <BackIcon />
              Back to restaurants
            </Link>

            <div className={styles.heroCopy}>
              <span
                className={styles.availability}
                data-state={availability.state}
              >
                <span aria-hidden />
                {availability.label}
              </span>

              <h1 id="restaurant-name">{row.name}</h1>

              <p className={styles.heroFacts}>
                <span>{row.area}</span>
                {summary.rating !== null ? (
                  <>
                    <span aria-hidden>•</span>
                    <span className={styles.rating}>
                      <StarIcon />
                      {summary.rating.toFixed(1)}
                      <span>({summary.reviewCount})</span>
                    </span>
                  </>
                ) : null}
                {summary.price_per_head ? (
                  <>
                    <span aria-hidden>•</span>
                    <span className={styles.price}>
                      ₹{summary.price_per_head} per head
                    </span>
                  </>
                ) : null}
              </p>

              {row.description ? (
                <p className={styles.description}>{row.description}</p>
              ) : null}

              <div className={styles.tags} aria-label="Restaurant features">
                {row.is_veg_only ? <Tag tone="teal">Pure veg</Tag> : null}
                {row.student_discount ? (
                  <Tag tone="teal">Student discount</Tag>
                ) : null}
                {row.has_ac ? <Tag>AC</Tag> : null}
                {row.dine_in ? <Tag>Dine-in</Tag> : null}
                {row.takeaway ? <Tag>Takeaway</Tag> : null}
                {row.vibe_tags.map((tag) => (
                  <Tag key={tag}>{vibeLabel(tag)}</Tag>
                ))}
              </div>
            </div>

            <div className={styles.utilityActions}>
              {isStudent ? (
                <SaveToggle restaurantId={id} initialSaved={savedIds.has(id)} />
              ) : null}

              {directionsHref ? (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.utilityAction}
                >
                  <DirectionsIcon />
                  Directions
                </a>
              ) : null}

              <ShareButton
                title={row.name}
                text={`${row.name} — ${row.area}. Found it on Destiny.`}
                className={styles.utilityButton}
                showIcon
              />
            </div>

            <div className={styles.bookingBlock}>
              <Link
                href={`/restaurant/${id}/book`}
                className={styles.bookingAction}
              >
                Let them know you&apos;re coming
                <ArrowIcon />
              </Link>
              <p>
                A heads-up, not a reservation — the owner sees your group is
                likely coming.
              </p>
            </div>
          </div>
        </section>

        {offers.length > 0 || events.length > 0 ? (
          <div
            className={styles.liveGrid}
            data-columns={
              offers.length > 0 && events.length > 0 ? 'two' : 'one'
            }
          >
            {offers.length > 0 ? (
              <section
                className={styles.offersSection}
                aria-labelledby="offers-title"
              >
                <div className={styles.sectionHeading}>
                  <h2 id="offers-title">Live offers</h2>
                  <p>Current specials listed by this restaurant.</p>
                </div>

                <div className={styles.offerList}>
                  {offers.map((offer) => (
                    <article key={offer.id} className={styles.offerCard}>
                      <OfferBadge
                        title={offer.title}
                        discountText={offer.discount_text}
                        expiresAt={offer.expires_at}
                        className={styles.offerBadge}
                      />
                      <h3>{offer.title}</h3>
                      {offer.description ? <p>{offer.description}</p> : null}
                      <FlagOfferButton offerId={offer.id} />
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {events.length > 0 ? (
              <section
                className={styles.eventsSection}
                aria-labelledby="events-title"
              >
                <div className={styles.sectionHeading}>
                  <h2 id="events-title">Upcoming here</h2>
                  <p>Events currently scheduled at this restaurant.</p>
                </div>

                <div className={styles.eventList}>
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      title={event.title}
                      eventType={event.event_type}
                      startsAt={event.starts_at}
                      description={event.description}
                      className={styles.eventCard}
                      rsvpSlot={
                        <RsvpButton
                          eventId={event.id}
                          initialGoing={myRsvps.has(event.id)}
                          loggedIn={isStudent}
                        />
                      }
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <section className={styles.menuSection} aria-labelledby="menu-title">
          <div className={styles.menuIntro}>
            <h2 id="menu-title">Menu</h2>
            <p>Browse listed dishes and current menu photos before you go.</p>
          </div>

          <div className={styles.menuContent}>
            {menu.length === 0 && menuPhotos.length === 0 ? (
              <div className={styles.emptyState}>
                <MenuIcon />
                <p>
                  Menu&apos;s not up yet — the owner is probably still typing it
                  in.
                </p>
              </div>
            ) : (
              <>
                {menu.length > 0 ? (
                  <div className={styles.menuPanel}>
                    {menu.map((item) => (
                      <MenuRow
                        key={item.id}
                        name={item.name}
                        price={item.price}
                        isVeg={item.is_veg}
                        unavailable={!item.is_available}
                        appearance="destiny"
                      />
                    ))}
                  </div>
                ) : null}

                {menuPhotos.length > 0 ? (
                  <div className={styles.menuPhotos}>
                    <h3>Menu photos</h3>
                    <PhotoCarousel
                      photos={menuPhotos}
                      alt={`${row.name} menu`}
                      className={styles.menuCarousel}
                      emptyFallback={<PhotoPlaceholderIcon />}
                      showControls
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        <div
          className={styles.detailsGrid}
          data-columns={hours ? 'two' : 'one'}
        >
          {hours ? (
            <section
              className={styles.hoursSection}
              aria-labelledby="hours-title"
            >
              <h2 id="hours-title">Hours</h2>
              <div className={styles.hoursList}>
                {WEEK.map((day) => (
                  <div key={day} className={styles.hoursRow}>
                    <span>{DAY_LABELS[day]}</span>
                    <strong>{formatDayShifts(hours[day])}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section
            className={styles.reviewsSection}
            aria-labelledby="reviews-title"
          >
            <div className={styles.sectionHeading}>
              <h2 id="reviews-title">Reviews</h2>
              <p>Verified feedback from completed student visits.</p>
            </div>
            <ReviewList
              appearance="destiny"
              reviews={reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at,
              }))}
            />
          </section>
        </div>

        <AlsoLike id={id} />
      </div>
    </DestinyPage>
  );
}

function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'teal';
}) {
  return (
    <span className={styles.tag} data-tone={tone}>
      {children}
    </span>
  );
}

async function AlsoLike({ id }: { id: string }) {
  const suggestions = await alsoLike(id);
  if (suggestions.length === 0) return null;

  return (
    <section
      className={styles.suggestionsSection}
      aria-labelledby="suggestions-title"
    >
      <div className={styles.suggestionsHeading}>
        <h2 id="suggestions-title">You may also like</h2>
        <Link href="/search">
          Browse all
          <ArrowIcon />
        </Link>
      </div>
      <div className={styles.suggestionsGrid}>
        {suggestions.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={withDetailArtwork(restaurant)}
            source="direct"
            className={styles.suggestionCard}
          />
        ))}
      </div>
    </section>
  );
}

function withDetailArtwork<T extends { name: string; photos: string[] }>(
  restaurant: T,
): T {
  const artwork = DETAIL_ARTWORK[restaurant.name];
  if (!artwork) return restaurant;
  return {
    ...restaurant,
    photos: [
      artwork,
      ...restaurant.photos.filter((photo) => photo !== artwork),
    ],
  };
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M19 12H5m6-6-6 6 6 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m12 3 9 9-9 9-9-9 9-9Z" />
      <path d="M8.5 12h7M13 8.5l3.5 3.5-3.5 3.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m12 2.8 2.75 5.58 6.16.9-4.46 4.34 1.05 6.13L12 16.86l-5.5 2.89 1.05-6.13L3.1 9.28l6.15-.9L12 2.8Z" />
    </svg>
  );
}

function PhotoPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M8 10h32v28H8zM8 32l9-9 7 7 5-5 11 11M31 19h.01" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M10 8h28v32H10zM16 17h16M16 24h16M16 31h10" />
    </svg>
  );
}
