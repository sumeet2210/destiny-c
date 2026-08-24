import { Suspense } from 'react';
import { BookingFilters } from '@/components/features/owner/BookingFilters';
import { OwnerBookingRow } from '@/components/features/owner/OwnerBookingRow';
import { filterOwnerBookings } from '@/lib/domain/booking-filters';
import { listOwnerBookings } from '@/lib/queries/owner';

export const metadata = { title: 'Bookings' };

export default async function OwnerBookingsPage(
  props: PageProps<'/owner/bookings'>,
) {
  const searchParams = await props.searchParams;
  // Always the owner's own rows under RLS; filtering only ever narrows them.
  const all = await listOwnerBookings();
  const bookings = filterOwnerBookings(all, {
    status: searchParams.status,
    guest: searchParams.guest,
  });

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

      {all.length === 0 ? (
        <p className="text-text-muted text-sm">
          No reservations yet. New requests will appear here.
        </p>
      ) : (
        <>
          <Suspense fallback={null}>
            <BookingFilters />
          </Suspense>

          {bookings.length === 0 ? (
            <p className="text-text-muted text-sm">
              No reservations match this filter. Clear the search or pick
              another status to see the rest.
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
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
