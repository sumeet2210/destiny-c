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
      <main className="mx-auto max-w-md px-4 pt-16 pb-28">
        <div className="flex items-center gap-3">
          <BookingsBackLink />
          <h1 className="font-display text-paper text-2xl font-extrabold">
            My bookings
          </h1>
        </div>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — log in needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/bookings');
  const bookings = await listStudentBookings();
  const activeBookings = bookings.filter((booking) =>
    ['requested', 'confirmed', 'unconfirmed'].includes(booking.status),
  ).length;
  const completedBookings = bookings.filter(
    (booking) => booking.status === 'completed',
  ).length;
  const cancelledBookings = bookings.filter(
    (booking) => booking.status === 'cancelled',
  ).length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-3 pt-3 pb-28 sm:px-5 sm:pt-5">
      <header className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_82%_12%,rgba(167,139,250,0.2),transparent_34%),radial-gradient(circle_at_12%_100%,rgba(71,215,255,0.08),transparent_32%),linear-gradient(145deg,#202020,#0d0d0d)] px-5 pt-16 pb-5 shadow-[0_22px_60px_rgba(0,0,0,0.34)] sm:p-8">
        <BookingsBackLink className="absolute top-4 left-5 sm:top-6 sm:left-8" />
        <div className="pointer-events-none absolute top-5 right-20 hidden h-px w-28 bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
        <div className="max-w-2xl">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#A78BFA] uppercase">
            Your reservations
          </p>
          <h1 className="font-display text-paper mt-2 text-[clamp(2.3rem,7vw,4.4rem)] leading-[0.9] font-extrabold tracking-[-0.065em]">
            Your booking plans.
          </h1>
          <p className="text-text-muted mt-4 max-w-lg text-[13px] leading-relaxed sm:text-sm">
            Track every reservation request, restaurant response, and upcoming
            table in one place.
          </p>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          <BookingStat label="Active" value={activeBookings} />
          <BookingStat label="Completed" value={completedBookings} />
          <BookingStat label="Cancelled" value={cancelledBookings} />
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="booking-history-title">
        <div>
          <p className="text-[10px] font-black tracking-[0.13em] text-[#A78BFA] uppercase">
            Your tables
          </p>
          <h2
            id="booking-history-title"
            className="font-display text-paper mt-1 text-2xl font-bold tracking-[-0.035em]"
          >
            Reservation history
          </h2>
        </div>

        {bookings.length === 0 ? (
          <Card className="text-text-muted text-center text-sm">
            Nothing yet. Find a spot on the{' '}
            <Link href="/" className="text-accent-primary hover:underline">
              homepage
            </Link>{' '}
            and let them know you&apos;re coming.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
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
      </section>
    </main>
  );
}

function BookingsBackLink({ className = '' }: { className?: string }) {
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

function BookingStat({ label, value }: { label: string; value: number }) {
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
