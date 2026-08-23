import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthGuard } from '@/components/features/AuthGuard';
import { BookingForm } from '@/components/features/BookingForm';
import { getRestaurantDetail } from '@/lib/api/restaurants';
import { BOOKING } from '@/config/booking';
import {
  bookingDayOptions,
  type DayKey,
  type OpeningHours,
  type Shift,
} from '@/lib/domain/hours';

export const metadata = { title: 'Reserve a table' };

export default async function BookPage(
  props: PageProps<'/restaurant/[id]/book'>,
) {
  const { id } = await props.params;
  const query = await props.searchParams;
  const bookForLater = query.later === '1';
  const detail = await getRestaurantDetail(id);
  if (!detail) notFound();

  const bookingDays = bookingDayOptions(
    detail.row.opening_hours as OpeningHours | null,
    {
      skipToday: bookForLater,
      leadTimeMinutes: BOOKING.minLeadTimeMinutes,
    },
  );

  const hours = detail.row.opening_hours as OpeningHours | null;
  const todayKey = new Date()
    .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' })
    .toLowerCase() as DayKey;
  const todayHours = hours
    ? formatBookingHours(hours[todayKey])
    : 'Hours not listed';
  const todayStatus =
    todayHours === 'Closed'
      ? 'Closed today.'
      : todayHours === 'Hours not listed'
        ? todayHours
        : `Open ${todayHours} today.`;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div className="flex items-start gap-3">
        <Link
          href={`/restaurant/${id}`}
          aria-label={`Back to ${detail.row.name}`}
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
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-paper text-2xl font-extrabold">
            Heading to {detail.row.name}?
          </h1>
          <p className="text-text-muted text-sm">{todayStatus}</p>
        </div>
      </div>

      <AuthGuard role="student">
        <BookingForm
          restaurantId={id}
          restaurantName={detail.row.name}
          bookingDays={bookingDays}
          bookForLater={bookForLater}
          offers={detail.offers.map((offer) => ({
            id: offer.id,
            title: offer.discount_text || offer.title,
            description: offer.description,
            detail: `Valid until ${formatBookingExtraDate(offer.expires_at)}`,
          }))}
          events={detail.events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            detail: formatBookingExtraDate(event.starts_at),
          }))}
        />
      </AuthGuard>
    </main>
  );
}

function formatBookingExtraDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function formatBookingHours(shifts: Shift[] | undefined) {
  if (!shifts?.length) return 'Closed';
  return shifts
    .map((shift) => `${formatClock(shift.open)} – ${formatClock(shift.close)}`)
    .join(', ');
}

function formatClock(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}
