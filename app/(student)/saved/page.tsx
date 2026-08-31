import Link from 'next/link';
import { RestaurantGrid } from '@/components/features/RestaurantGrid';
import { EventCard } from '@/components/features/EventCard';
import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import {
  listRestaurantSummaries,
  listUpcomingEvents,
} from '@/lib/queries/catalog';
import { getMyRsvpIds, getSavedIds } from '@/lib/queries/social';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'Saved' };

export default async function SavedPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 pt-16 pb-28">
        <div className="flex items-center gap-3">
          <SavedBackLink />
          <h1 className="font-display text-paper text-2xl font-extrabold">
            Saved
          </h1>
        </div>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — saving needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/saved');
  const [summaries, savedIds, events, interestedIds] = await Promise.all([
    listRestaurantSummaries(),
    getSavedIds(),
    listUpcomingEvents(),
    getMyRsvpIds(),
  ]);
  const saved = summaries.filter((r) => savedIds.has(r.id));
  const interestedEvents = events.filter((event) =>
    interestedIds.has(event.id),
  );
  const savedWithOffers = saved.filter((restaurant) => restaurant.liveOffer);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-3 pt-3 pb-28 sm:px-5 sm:pt-5">
      <header className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_82%_12%,rgba(167,139,250,0.2),transparent_34%),radial-gradient(circle_at_12%_100%,rgba(71,215,255,0.08),transparent_32%),linear-gradient(145deg,#202020,#0d0d0d)] px-5 pt-16 pb-5 shadow-[0_22px_60px_rgba(0,0,0,0.34)] sm:p-8">
        <SavedBackLink className="absolute top-4 left-5 sm:top-6 sm:left-8" />
        <div className="pointer-events-none absolute top-5 right-20 hidden h-px w-28 bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
        <div className="max-w-2xl">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#A78BFA] uppercase">
            Your private collection
          </p>
          <h1 className="font-display text-paper mt-2 text-[clamp(2.3rem,7vw,4.4rem)] leading-[0.9] font-extrabold tracking-[-0.065em]">
            Your saved scene.
          </h1>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          <SavedStat label="Places" value={saved.length} />
          <SavedStat label="Live offers" value={savedWithOffers.length} />
          <SavedStat label="Events" value={interestedEvents.length} />
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="saved-places-title">
        <h2
          id="saved-places-title"
          className="font-display text-paper text-2xl font-bold tracking-[-0.035em]"
        >
          Saved restaurants
        </h2>
        {saved.length === 0 ? (
          <Card className="text-text-muted text-center text-sm">
            Nothing saved yet
          </Card>
        ) : (
          <RestaurantGrid restaurants={saved} source="direct" />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="saved-offers-title">
        <div>
          <p className="text-accent-primary text-[11px] font-extrabold tracking-[0.1em] uppercase">
            Still live
          </p>
          <h2
            id="saved-offers-title"
            className="font-display text-paper mt-1 text-2xl font-bold tracking-[-0.035em]"
          >
            Offers at your saved places
          </h2>
        </div>
        {savedWithOffers.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedWithOffers.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurant/${restaurant.id}`}
                className="group relative overflow-hidden rounded-[1.15rem] border border-white/10 bg-[linear-gradient(145deg,#202020,#121212)] p-4 text-inherit no-underline shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-[border-color,transform,box-shadow] hover:-translate-y-1 hover:border-[#A78BFA]/55 hover:shadow-[0_18px_36px_rgba(0,0,0,0.3)]"
              >
                <span className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#A78BFA]/[0.07]" />
                <span className="relative text-[9px] font-black tracking-[0.12em] text-[#A78BFA] uppercase">
                  {restaurant.name}
                </span>
                <strong className="text-paper relative mt-3 block text-lg leading-tight font-extrabold tracking-[-0.025em]">
                  {restaurant.liveOffer?.discount_text ||
                    restaurant.liveOffer?.title}
                </strong>
                {restaurant.liveOffer?.discount_text && (
                  <span className="text-text-muted relative mt-1 block text-xs">
                    {restaurant.liveOffer.title}
                  </span>
                )}
                <span className="relative mt-5 flex items-center justify-between border-t border-white/8 pt-3 text-[10px] font-bold text-white/45">
                  Ends {formatOfferExpiry(restaurant.liveOffer!.expires_at)}
                  <b className="grid size-7 place-items-center rounded-full bg-white/7 text-[#A78BFA] transition-[background,transform] group-hover:translate-x-1 group-hover:bg-white/12">
                    →
                  </b>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-text-muted text-center text-sm">
            No live offers at your saved restaurants right now.
          </Card>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="saved-events-title">
        <div>
          <p className="text-[10px] font-black tracking-[0.13em] text-[#47D7FF] uppercase">
            The Scene
          </p>
          <h2
            id="saved-events-title"
            className="font-display text-paper mt-1 text-2xl font-bold tracking-[-0.035em]"
          >
            Interested events
          </h2>
        </div>
        {interestedEvents.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {interestedEvents.map((event) => (
              <div key={event.id} className="space-y-2">
                <EventCard
                  title={event.title}
                  eventType={event.event_type}
                  startsAt={event.starts_at}
                  restaurantName={event.restaurantName}
                  restaurantId={event.restaurant_id}
                  description={event.description}
                />
                <Link
                  href={`/events/${event.id}`}
                  className="text-accent-primary inline-flex min-h-11 items-center text-[13px] font-bold hover:underline"
                >
                  View event details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-text-muted text-center text-sm">
            Events you mark Interested will appear here.
          </Card>
        )}
      </section>
    </main>
  );
}

function SavedBackLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/account"
      aria-label="Back to profile"
      className={`border-border-hairline bg-surface-muted text-paper hover:bg-surface-raised grid size-10 shrink-0 place-items-center rounded-full border transition-colors ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5 fill-none stroke-current stroke-2"
      >
        <path
          d="m15 18-6-6 6-6M9 12h10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function SavedStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[0.95rem] border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-sm sm:px-4">
      <span className="mb-2 block h-0.5 w-5 rounded-full bg-[#A78BFA]" />
      <strong className="text-paper block font-mono text-xl font-black">
        {value}
      </strong>
      <span className="text-text-muted mt-0.5 block text-[9px] font-bold uppercase">
        {label}
      </span>
    </div>
  );
}

function formatOfferExpiry(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}
