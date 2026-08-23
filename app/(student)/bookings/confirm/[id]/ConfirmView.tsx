'use client';

import Link from 'next/link';
import { ConfirmCard } from '@/components/features/ConfirmCard';
import { AuthGuard } from '@/components/features/AuthGuard';
import { LoadingBlock, ErrorBlock } from '@/components/features/AsyncStates';
import { Card } from '@/components/ui/Card';
import { getStudentBooking } from '@/lib/api/bookings';
import { useApi } from '@/lib/hooks/useApi';

export function ConfirmView({ id }: { id: string }) {
  return (
    <AuthGuard role="student">
      <ConfirmContent id={id} />
    </AuthGuard>
  );
}

function ConfirmContent({ id }: { id: string }) {
  const {
    data: booking,
    loading,
    error,
    reload,
  } = useApi(() => getStudentBooking(id), [id]);

  if (loading && !booking) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        <LoadingBlock label="Loading your booking…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        <ErrorBlock message={error} onRetry={reload} />
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Booking not found
        </h1>
        <Card className="text-text-muted text-center text-sm">
          We couldn&apos;t find that booking. It may have been cancelled or the
          link is out of date.
        </Card>
        <p className="text-text-muted text-center text-[13px]">
          <Link href="/bookings" className="text-accent-primary hover:underline">
            All my bookings
          </Link>
        </p>
      </main>
    );
  }

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
