'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  canConfirm,
  formatBookingWindow,
  type BookingStatus,
} from '@/lib/domain/booking';
import { confirmBooking } from '@/lib/bookings/actions';

export function ConfirmCard({
  booking,
}: {
  booking: {
    id: string;
    restaurantName: string;
    booking_time: string;
    booking_end_time: string;
    headcount: number;
    status: BookingStatus;
    reminder_sent_at: string | null;
    confirmed_at: string | null;
  };
}) {
  const [mountedAt] = useState(() => new Date());
  const [confirmed, setConfirmed] = useState(booking.confirmed_at !== null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const when = formatBookingWindow(
    booking.booking_time,
    booking.booking_end_time,
  );

  if (confirmed) {
    return (
      <Card className="space-y-1 text-center">
        <SuccessIcon />
        <p className="text-paper text-sm">
          Confirmed — the owner knows you&apos;re coming at{' '}
          <span className="font-mono">{when}</span>.
        </p>
      </Card>
    );
  }

  if (!canConfirm(booking, mountedAt)) {
    return (
      <Card className="text-text-muted text-center text-sm">
        {booking.status === 'cancelled'
          ? 'This booking was cancelled.'
          : new Date(booking.booking_time) < mountedAt
            ? 'This one is in the past now.'
            : 'Nothing to confirm yet — we’ll nudge you closer to the time.'}
      </Card>
    );
  }

  return (
      <Card className="space-y-3 text-center">
        <p className="text-text-muted text-sm">
          <span className="font-mono">{when}</span> ·{' '}
        <span className="font-mono">{booking.headcount}</span> people
      </p>
      {error && <p className="text-accent-urgent-text text-[13px]">{error}</p>}
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await confirmBooking(booking.id);
            if (res.ok) setConfirmed(true);
            else setError(res.message ?? 'Could not confirm.');
          })
        }
      >
        {pending ? 'Confirming…' : "Yes, we're coming"}
      </Button>
      <p className="text-text-muted text-[11px]">
        Not going to make it? Cancel from My bookings so the restaurant can
        release the table.
      </p>
    </Card>
  );
}

function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-accent-primary mx-auto size-8 fill-none stroke-current stroke-2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" />
    </svg>
  );
}
