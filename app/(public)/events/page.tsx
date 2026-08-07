import { Suspense } from 'react';
import { EventCard } from '@/components/features/EventCard';
import { RsvpButton } from '@/components/features/RsvpButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { getSessionUser } from '@/lib/auth/session';
import { listUpcomingEvents } from '@/lib/queries/catalog';
import { getFriendActivity, getMyRsvpIds } from '@/lib/queries/social';

export const metadata = { title: 'Events' };

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Upcoming events
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Live music, open mics, screenings — what the places around campus are
          putting on.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        }
      >
        <EventsList />
      </Suspense>
    </main>
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
    return (
      <div className="rounded-card border-border-hairline bg-surface-muted border p-8 text-center">
        <p className="text-paper text-sm">Nothing on the calendar right now.</p>
        <p className="text-text-muted mt-1 text-[13px]">
          Owners post events here — check back before the weekend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <EventCard
          key={e.id}
          title={e.title}
          eventType={e.event_type}
          startsAt={e.starts_at}
          restaurantName={e.restaurantName}
          restaurantId={e.restaurant_id}
          description={e.description}
          rsvpSlot={
            <RsvpButton
              eventId={e.id}
              initialGoing={myRsvps.has(e.id)}
              loggedIn={isStudent}
              friendsGoing={activity.goingTo.get(e.id)}
            />
          }
        />
      ))}
    </div>
  );
}
