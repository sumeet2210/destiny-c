import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventCard } from '@/components/features/EventCard';
import { FlagOfferButton } from '@/components/features/FlagOfferButton';
import { OfferBadge } from '@/components/features/OfferBadge';
import { ProfileViewLogger } from '@/components/features/ProfileViewLogger';
import { RestaurantCard } from '@/components/features/RestaurantCard';
import { ReviewList } from '@/components/features/ReviewList';
import { ShareButton } from '@/components/features/ShareButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MenuRow } from '@/components/ui/MenuRow';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { VIBES } from '@/config/vibes';
import {
  DAY_LABELS,
  WEEK,
  formatDayShifts,
  type OpeningHours,
} from '@/lib/domain/hours';
import { RsvpButton } from '@/components/features/RsvpButton';
import { SaveToggle } from '@/components/features/SaveToggle';
import { getSessionUser } from '@/lib/auth/session';
import { alsoLike, getRestaurantDetail } from '@/lib/queries/catalog';
import { getMyRsvpIds, getSavedIds } from '@/lib/queries/social';

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

  const { summary: s, row, menu, menuPhotos, offers, events, reviews } = detail;
  const from = typeof search.from === 'string' ? search.from : 'direct';
  const hours = row.opening_hours as OpeningHours | null;
  const vibeLabel = (tag: string) =>
    VIBES.find((v) => v.tag === tag)?.label ?? tag;
  const directionsHref =
    s.lat !== null && s.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
      : null;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
      <ProfileViewLogger restaurantId={id} source={from} />

      <section>
        <PhotoCarousel
          photos={s.photos}
          alt={row.name}
          className="rounded-card overflow-hidden"
        />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-paper text-2xl font-extrabold">
              {row.name}
            </h1>
            <p className="text-text-muted mt-1 flex flex-wrap items-center gap-x-2 text-[13px]">
              <span>{row.area}</span>
              <span aria-hidden>·</span>
              {s.isOpen ? (
                s.closingInMinutes !== null && s.closingInMinutes <= 45 ? (
                  <span className="text-accent-urgent-text">
                    Closing in{' '}
                    <span className="font-mono">{s.closingInMinutes}m</span>
                  </span>
                ) : (
                  <span className="text-accent-secondary">Open now</span>
                )
              ) : (
                <span>Closed right now</span>
              )}
              {s.rating !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    <span aria-hidden>★ </span>
                    <span className="font-mono">
                      {s.rating.toFixed(1)}
                    </span>{' '}
                    <span className="text-[11px]">
                      ({s.reviewCount} reviews)
                    </span>
                  </span>
                </>
              )}
              {s.price_per_head && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    <span className="font-mono">₹{s.price_per_head}</span>/head
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isStudent && (
              <SaveToggle restaurantId={id} initialSaved={savedIds.has(id)} />
            )}
            {directionsHref && (
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-control border-border-hairline text-paper hover:bg-surface-raised inline-flex h-8 items-center border px-3 text-[13px]"
              >
                Directions
              </a>
            )}
            <ShareButton
              title={row.name}
              text={`${row.name} — ${row.area}. Found it on Destiny.`}
            />
          </div>
        </div>

        {row.description && (
          <p className="text-text-muted mt-3 text-sm">{row.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {row.is_veg_only && (
            <span className="rounded-chip border-accent-secondary text-accent-secondary border px-2 py-0.5 text-[11px]">
              Pure veg
            </span>
          )}
          {row.student_discount && (
            <span className="rounded-chip border-accent-primary text-accent-primary border px-2 py-0.5 text-[11px]">
              Student discount
            </span>
          )}
          {row.has_ac && <Tag>AC</Tag>}
          {row.dine_in && <Tag>Dine-in</Tag>}
          {row.takeaway && <Tag>Takeaway</Tag>}
          {row.vibe_tags.map((t) => (
            <Tag key={t}>{vibeLabel(t)}</Tag>
          ))}
        </div>

        <div className="mt-4">
          <Link href={`/restaurant/${id}/book`}>
            <Button size="lg" className="w-full sm:w-auto">
              Let them know you&apos;re coming
            </Button>
          </Link>
          <p className="text-text-muted mt-1.5 text-[11px]">
            A heads-up, not a reservation — the owner sees your group is likely
            coming.
          </p>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-paper text-lg font-bold">
            Live offers
          </h2>
          {offers.map((o) => (
            <Card key={o.id} className="space-y-1.5">
              <OfferBadge
                title={o.title}
                discountText={o.discount_text}
                expiresAt={o.expires_at}
              />
              <p className="text-paper text-sm font-medium">{o.title}</p>
              {o.description && (
                <p className="text-text-muted text-[13px]">{o.description}</p>
              )}
              <FlagOfferButton offerId={o.id} />
            </Card>
          ))}
        </section>
      )}

      {events.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-paper text-lg font-bold">
            Upcoming here
          </h2>
          {events.map((e) => (
            <EventCard
              key={e.id}
              title={e.title}
              eventType={e.event_type}
              startsAt={e.starts_at}
              description={e.description}
              rsvpSlot={
                <RsvpButton
                  eventId={e.id}
                  initialGoing={myRsvps.has(e.id)}
                  loggedIn={isStudent}
                />
              }
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-paper text-lg font-bold">Menu</h2>
        {menu.length === 0 && menuPhotos.length === 0 ? (
          <p className="text-text-muted text-sm">
            Menu&apos;s not up yet — the owner is probably still typing it in.
          </p>
        ) : (
          <>
            {menu.length > 0 && (
              <Card>
                {menu.map((m) => (
                  <MenuRow
                    key={m.id}
                    name={m.name}
                    price={m.price}
                    isVeg={m.is_veg}
                    unavailable={!m.is_available}
                  />
                ))}
              </Card>
            )}
            {menuPhotos.length > 0 && (
              <div>
                <h3 className="text-text-muted mb-2 text-[13px] font-medium">
                  Menu photos
                </h3>
                <PhotoCarousel
                  photos={menuPhotos}
                  alt={`${row.name} menu`}
                  className="rounded-card overflow-hidden"
                />
              </div>
            )}
          </>
        )}
      </section>

      {hours && (
        <section className="space-y-3">
          <h2 className="font-display text-paper text-lg font-bold">Hours</h2>
          <Card>
            {WEEK.map((day) => (
              <div
                key={day}
                className="flex items-baseline justify-between py-1 text-sm"
              >
                <span className="text-text-muted">{DAY_LABELS[day]}</span>
                <span className="text-paper font-mono text-[13px]">
                  {formatDayShifts(hours[day])}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-paper text-lg font-bold">Reviews</h2>
        <ReviewList
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
          }))}
        />
      </section>

      <AlsoLike id={id} />
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-chip border-border-hairline bg-surface-raised text-text-muted border px-2 py-0.5 text-[11px]">
      {children}
    </span>
  );
}

async function AlsoLike({ id }: { id: string }) {
  const suggestions = await alsoLike(id);
  if (suggestions.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-paper text-lg font-bold">
        You may also like
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {suggestions.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} source="direct" />
        ))}
      </div>
    </section>
  );
}
