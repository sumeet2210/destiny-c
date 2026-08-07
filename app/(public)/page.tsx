import Link from 'next/link';
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
import { getFriendActivity, getSavedIds } from '@/lib/queries/social';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <section className="hero-entrance space-y-1">
        <h1 className="font-display text-paper text-3xl font-extrabold">
          Where&apos;s dinner?
        </h1>
        <p className="text-text-muted text-sm">
          Live offers, events and menus from the places around campus.{' '}
          <Link
            href="/quiz"
            className="text-accent-primary underline-offset-2 hover:underline"
          >
            Can&apos;t decide? Take the 3-tap quiz →
          </Link>
        </p>
      </section>

      <Suspense fallback={<Skeleton className="h-28 w-full" />}>
        <TickerSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <CravingSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <EventsPeek />
      </Suspense>

      <Suspense fallback={null}>
        <SquadSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        }
      >
        <PopularSection />
      </Suspense>
    </main>
  );
}

async function TickerSection() {
  const offers = await listTickerOffers();
  return (
    <section aria-label="Today's specials" className="space-y-2">
      <h2 className="font-display text-paper text-lg font-bold">
        Today&apos;s specials
      </h2>
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
    <section className="space-y-2">
      <h2 className="font-display text-paper text-lg font-bold">
        What are you craving?
      </h2>
      <CravingExplorer restaurants={restaurants} />
    </section>
  );
}

async function EventsPeek() {
  const events = await listUpcomingEvents();
  if (events.length === 0) return null;
  const next = events[0];
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-paper text-lg font-bold">
          Happening soon
        </h2>
        <Link
          href="/events"
          className="text-accent-primary text-[13px] underline-offset-2 hover:underline"
        >
          All events →
        </Link>
      </div>
      <EventCard
        title={next.title}
        eventType={next.event_type}
        startsAt={next.starts_at}
        restaurantName={next.restaurantName}
        restaurantId={next.restaurant_id}
        description={next.description}
      />
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
    <section className="space-y-2">
      <h2 className="font-display text-paper text-lg font-bold">
        Where the squad&apos;s going
      </h2>
      {events.length === 0 ? (
        <p className="text-text-muted text-[13px]">
          Friends have saved places below — look for their names on the cards.
        </p>
      ) : (
        events.map((e) => {
          const names = activity.goingTo.get(e.id)!;
          return (
            <EventCard
              key={e.id}
              title={e.title}
              eventType={e.event_type}
              startsAt={e.starts_at}
              restaurantName={e.restaurantName}
              restaurantId={e.restaurant_id}
              rsvpSlot={
                <span className="text-accent-primary text-[12px]">
                  {names.length === 1
                    ? `${names[0]} is going`
                    : `${names[0]} + ${names.length - 1} more going`}
                </span>
              }
            />
          );
        })
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
  const restaurants = applyFilters(summaries, { sort: 'trending' });
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
    <section className="space-y-2">
      <h2 className="font-display text-paper text-lg font-bold">
        Popular this week
      </h2>
      <RestaurantGrid
        restaurants={restaurants}
        source="homepage_feed"
        saveSlots={saveSlots}
        friendNotes={friendNotes}
      />
    </section>
  );
}
