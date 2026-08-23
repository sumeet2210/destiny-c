'use client';

import Link from 'next/link';
import { BookingRow } from '@/components/features/BookingRow';
import { ReviewForm } from '@/components/features/ReviewForm';
import { AuthGuard } from '@/components/features/AuthGuard';
import { LoadingBlock, ErrorBlock } from '@/components/features/AsyncStates';
import { canReview } from '@/lib/domain/booking';
import { listStudentBookings } from '@/lib/api/bookings';
import { useApi } from '@/lib/hooks/useApi';
import { Card } from '@/components/ui/Card';

export function BookingsView() {
  return (
    <AuthGuard role="student">
      <BookingsContent />
    </AuthGuard>
  );
}

function BookingsContent() {
  const { data: bookings, loading, error, reload } = useApi(
    () => listStudentBookings(),
    [],
  );

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-16 pb-28">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        My bookings
      </h1>
      <p className="text-text-muted text-[13px]">
        Track each reservation request and the restaurant owner&apos;s decision.
      </p>

      {loading && !bookings ? (
        <LoadingBlock label="Loading your bookings…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !bookings || bookings.length === 0 ? (
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
              onChanged={reload}
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
                    onPosted={reload}
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
