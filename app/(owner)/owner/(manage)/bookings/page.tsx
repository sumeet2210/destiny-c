import { Suspense } from 'react';
import { BookingFilters } from '@/components/features/owner/BookingFilters';
import { OwnerBookingRow } from '@/components/features/owner/OwnerBookingRow';
import {
  filterOwnerBookings,
  normalizeGuestQuery,
  parseStatusFilter,
} from '@/lib/domain/booking-filters';
import { listOwnerBookings } from '@/lib/queries/owner';

export const metadata = { title: 'Bookings' };

export default async function OwnerBookingsPage(
  props: PageProps<'/owner/bookings'>,
) {
  const searchParams = await props.searchParams;
  const status = parseStatusFilter(searchParams.status);
  const guest = normalizeGuestQuery(searchParams.guest);
  // Always the owner's own rows under RLS; filtering only ever narrows them.
  const all = await listOwnerBookings();
  const bookings = filterOwnerBookings(all, { status, guest });

  // Built from the parsed filters rather than the raw query string, so the file
  // can never cover a different set of rows than the page is showing.
  const exportParams = new URLSearchParams();
  if (status === 'cancelled') exportParams.set('status', status);
  if (guest) exportParams.set('guest', guest);
  const exportQuery = exportParams.toString();
  const exportHref = `/api/owner/bookings/export${exportQuery ? `?${exportQuery}` : ''}`;

  const countLabel =
    bookings.length === all.length
      ? `${all.length} reservation${all.length === 1 ? '' : 's'}`
      : `${bookings.length} of ${all.length} shown`;

  return (
    <div className="w-full space-y-5">
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
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-text-muted text-[13px]">{countLabel}</p>
                {/*
                  A plain anchor, not Link or Button: the download needs a real
                  browser navigation to the route handler so the
                  Content-Disposition header takes effect. Classes mirror the
                  outline/sm Button variant.
                */}
                <a
                  href={exportHref}
                  className="rounded-control border-border-hairline text-paper hover:bg-surface-raised inline-flex h-8 shrink-0 items-center border px-3 text-[13px] no-underline transition-colors"
                >
                  Export CSV
                </a>
              </div>

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
            </>
          )}
        </>
      )}
    </div>
  );
}
