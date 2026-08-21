// P6-8: the page the reminder email links to.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConfirmCard } from '@/components/features/ConfirmCard';
import { requireStudent } from '@/lib/auth/session';
import { getStudentBooking } from '@/lib/queries/bookings';

export const metadata = { title: 'Still coming?' };

export default async function ConfirmPage(
  props: PageProps<'/bookings/confirm/[id]'>,
) {
  const { id } = await props.params;
  await requireStudent(`/bookings/confirm/${id}`);
  const booking = await getStudentBooking(id);
  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-10">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Still on for {booking.restaurantName}?
      </h1>
      <ConfirmCard
        booking={{
          id: booking.id,
          restaurantName: booking.restaurantName,
          booking_time: booking.booking_time,
          booking_end_time: booking.booking_end_time,
          headcount: booking.headcount,
          status: booking.status,
          reminder_sent_at: booking.reminder_sent_at,
          confirmed_at: booking.confirmed_at,
        }}
      />
      <p className="text-text-muted text-center text-[13px]">
        <Link href="/bookings" className="text-accent-primary hover:underline">
          All my bookings
        </Link>
      </p>
    </main>
  );
}
