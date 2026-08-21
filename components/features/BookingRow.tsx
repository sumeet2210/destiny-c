'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  formatBookingWindow,
  STATUS_LABELS,
  canCancel,
  canConfirm,
  type BookingStatus,
} from '@/lib/domain/booking';
import { cancelBooking, confirmBooking } from '@/lib/bookings/actions';
import { cn } from '@/lib/cn';

type Item = {
  id: string;
  restaurantName: string;
  booking_time: string;
  booking_end_time: string;
  headcount: number;
  status: BookingStatus;
  reminder_sent_at: string | null;
  confirmed_at: string | null;
  owner_note: string | null;
  special_request: string | null;
  owner_decided_at: string | null;
  owner_response: string | null;
  offerTitle: string | null;
  eventTitle: string | null;
};

const statusTone: Record<BookingStatus, string> = {
  requested: 'text-text-muted',
  confirmed: 'text-accent-secondary',
  unconfirmed: 'text-accent-urgent-text',
  completed: 'text-text-muted',
  cancelled: 'text-text-muted',
};

export function BookingRow({
  booking,
  reviewSlot,
}: {
  booking: Item;
  reviewSlot?: React.ReactNode;
}) {
  const [mountedAt] = useState(() => new Date());
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const showConfirm = canConfirm(booking, mountedAt);
  const showCancel = canCancel(booking, mountedAt);

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-paper text-sm font-semibold">
          {booking.restaurantName}
        </p>
        <span className={cn('text-[12px]', statusTone[booking.status])}>
          {booking.status === 'confirmed' && booking.confirmed_at
            ? 'You confirmed'
            : booking.status === 'cancelled' &&
                booking.owner_response === 'rejected'
              ? 'Rejected by owner'
              : STATUS_LABELS[booking.status]}
        </span>
      </div>
      <p className="text-text-muted text-[13px]">
        <span className="font-mono">
          {formatBookingWindow(booking.booking_time, booking.booking_end_time)}
        </span>
        <span aria-hidden> · </span>
        <span className="font-mono">{booking.headcount}</span> people
      </p>
      {booking.special_request && (
        <p className="text-text-muted text-[13px]">
          “{booking.special_request}”
        </p>
      )}
      {booking.offerTitle && (
        <p className="text-text-muted text-[13px]">
          Offer: <span className="text-paper">{booking.offerTitle}</span>
        </p>
      )}
      {booking.eventTitle && (
        <p className="text-text-muted text-[13px]">
          Event: <span className="text-paper">{booking.eventTitle}</span>
        </p>
      )}
      {booking.owner_note && (
        <p className="rounded-control bg-surface-raised text-paper p-2 text-[13px]">
          <span className="text-text-muted">Note from the owner: </span>
          {booking.owner_note}
        </p>
      )}
      {reviewSlot && <div className="pt-1">{reviewSlot}</div>}
      {(showConfirm || showCancel) && (
        <div className="flex gap-2 pt-1">
          {showConfirm && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await confirmBooking(booking.id);
                  toast(
                    res.ok
                      ? 'Confirmed — see you there'
                      : (res.message ?? 'Failed'),
                    res.ok ? 'positive' : 'error',
                  );
                })
              }
            >
              Still coming
            </Button>
          )}
          {showCancel && (
            <Button
              variant="urgent-text"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await cancelBooking(booking.id);
                  toast(
                    res.ok
                      ? 'Cancelled — the owner will see'
                      : (res.message ?? 'Failed'),
                    res.ok ? 'default' : 'error',
                  );
                })
              }
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
