import { OwnerBookingRow } from '@/components/features/owner/OwnerBookingRow';
import { listOwnerBookings } from '@/lib/queries/owner';

export const metadata = { title: 'Bookings' };

export default async function OwnerBookingsPage() {
  const bookings = await listOwnerBookings();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Bookings
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Heads-up notices from student groups. &ldquo;Likely no-show&rdquo;
          means they didn&apos;t confirm the reminder — they may still turn up.
          You can leave a note they&apos;ll see; there&apos;s nothing to accept
          or decline.
        </p>
      </div>

      {bookings.length === 0 ? (
        <p className="text-text-muted text-sm">
          No bookings yet. They&apos;ll appear here the moment a group sends a
          heads-up.
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
