import Link from 'next/link';
import { BookingRow } from '@/components/features/BookingRow';
import { ReviewForm } from '@/components/features/ReviewForm';
import { canReview } from '@/lib/domain/booking';
import { requireStudent } from '@/lib/auth/session';
import { listStudentBookings } from '@/lib/queries/bookings';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const metadata = { title: 'My bookings' };

export default async function BookingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 pt-6 pb-28">
        <BookingsHeader />
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — log in needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/bookings');
  const bookings = await listStudentBookings();

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-6 pb-28">
      <BookingsHeader />
      <p className="text-text-muted text-[13px]">
        Track each reservation request and the restaurant owner&apos;s decision.
      </p>

      {bookings.length === 0 ? (
        <Card className="text-text-muted text-center text-sm">
          Nothing yet. Find a spot on the{' '}
          <Link href="/" className="text-accent-primary hover:underline">
            homepage
          </Link>{' '}
          and let them know you&apos;re coming.
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={{
                id: b.id,
                restaurantName: b.restaurantName,
                booking_time: b.booking_time,
                booking_end_time: b.booking_end_time,
                headcount: b.headcount,
                status: b.status,
                reminder_sent_at: b.reminder_sent_at,
                confirmed_at: b.confirmed_at,
                owner_note: b.owner_note,
                special_request: b.special_request,
                owner_decided_at: b.owner_decided_at,
                owner_response: b.owner_response,
                offerTitle: b.offerTitle,
                eventTitle: b.eventTitle,
              }}
              reviewSlot={
                canReview(b) && !b.alreadyReviewed ? (
                  <ReviewForm
                    bookingId={b.id}
                    restaurantName={b.restaurantName}
                  />
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

function BookingsHeader() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/account"
        aria-label="Back to profile"
        className="border-border-hairline bg-surface-muted text-paper hover:bg-surface-raised grid size-10 shrink-0 place-items-center rounded-full border transition-colors"
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
      <h1 className="font-display text-paper text-2xl font-extrabold">
        My bookings
      </h1>
    </div>
  );
}
