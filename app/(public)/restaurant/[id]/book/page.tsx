import { notFound } from 'next/navigation';
import { BookingForm } from '@/components/features/BookingForm';
import { getRestaurantDetail } from '@/lib/queries/catalog';
import { requireStudent } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { BOOKING } from '@/config/booking';
import { bookingDayOptions, type OpeningHours } from '@/lib/domain/hours';

export const metadata = { title: 'Let them know' };

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

  if (isSupabaseConfigured()) {
    await requireStudent(
      `/restaurant/${id}/book${bookForLater ? '?later=1' : ''}`,
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Heading to {detail.row.name}?
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          This lets the owner know a group is likely coming. It&apos;s a
          heads-up, not a reservation — no table is being held.
        </p>
      </div>

      {!isSupabaseConfigured() && (
        <Card className="border-accent-primary text-text-muted text-[13px]">
          Seed mode: the form works, but submitting needs a live Supabase
          project.
        </Card>
      )}

      <BookingForm
        restaurantId={id}
        restaurantName={detail.row.name}
        bookingDays={bookingDays}
        bookForLater={bookForLater}
      />
    </main>
  );
}
