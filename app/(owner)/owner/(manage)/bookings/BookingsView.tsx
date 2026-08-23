'use client';

import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { OwnerBookingRow } from '@/components/features/owner/OwnerBookingRow';
import { listOwnerBookings } from '@/lib/api/owner';
import { useApi } from '@/lib/hooks/useApi';

export function BookingsView() {
  const { data: bookings, error, reload } = useApi(
    () => listOwnerBookings(),
    [],
  );

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Bookings
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Review incoming table requests, then accept or reject each one. You
          can also leave a note the student will see.
        </p>
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !bookings ? (
        <LoadingBlock label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <p className="text-text-muted text-sm">
          No reservations yet. New requests will appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <OwnerBookingRow
              key={b.id}
              booking={{
                id: b.id,
                studentName: b.studentName,
                studentNoShows: b.studentNoShows,
                booking_time: b.booking_time,
                headcount: b.headcount,
                special_request: b.special_request,
                status: b.status,
                confirmed_at: b.confirmed_at,
                owner_note: b.owner_note,
                offerTitle: b.offerTitle,
                eventTitle: b.eventTitle,
              }}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
