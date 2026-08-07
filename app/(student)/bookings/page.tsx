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
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          My bookings
        </h1>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — log in needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/bookings');
  const bookings = await listStudentBookings();

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        My bookings
      </h1>
      <p className="text-text-muted text-[13px]">
        These are heads-ups you&apos;ve sent — the owner knows you&apos;re
        likely coming, but no table is held.
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
                headcount: b.headcount,
                status: b.status,
                reminder_sent_at: b.reminder_sent_at,
                confirmed_at: b.confirmed_at,
                owner_note: b.owner_note,
                special_request: b.special_request,
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
