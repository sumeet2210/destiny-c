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
  requested: 'border-white/10 bg-white/5 text-white/55',
  confirmed: 'border-[#A78BFA]/35 bg-[#A78BFA]/10 text-[#A78BFA]',
  unconfirmed:
    'border-accent-urgent-text/25 bg-accent-urgent-text/10 text-accent-urgent-text',
  completed: 'border-[#47D7FF]/25 bg-[#47D7FF]/10 text-[#47D7FF]',
  cancelled: 'border-white/10 bg-black/20 text-white/45',
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
    <Card className="relative overflow-hidden border-white/10 bg-[linear-gradient(145deg,#202020,#121212)] shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
      <span className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#A78BFA]/[0.07]" />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-paper text-base leading-tight font-extrabold tracking-[-0.02em]">
            {booking.restaurantName}
          </p>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-1 text-[10px] leading-none font-bold',
              statusTone[booking.status],
            )}
          >
            {booking.status === 'confirmed' && booking.confirmed_at
              ? 'You confirmed'
              : booking.status === 'cancelled' &&
                  booking.owner_response === 'rejected'
                ? 'Rejected by owner'
                : STATUS_LABELS[booking.status]}
          </span>
        </div>
        <p className="text-text-muted border-t border-white/8 pt-3 text-[13px]">
          <span className="font-mono">
            {formatBookingWindow(
              booking.booking_time,
              booking.booking_end_time,
            )}
          </span>
          <span aria-hidden> · </span>
          <span className="font-mono">{booking.headcount}</span>{' '}
          {booking.headcount === 1 ? 'guest' : 'guests'}
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
          <p className="rounded-control border border-white/8 bg-black/20 p-2.5 text-[13px] text-white/85">
            <span className="text-text-muted">Note from the owner: </span>
            {booking.owner_note}
          </p>
        )}
        {reviewSlot && <div className="pt-1">{reviewSlot}</div>}
        {(showConfirm || showCancel) && (
          <div className="flex gap-2 border-t border-white/8 pt-3">
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
                Cancel booking
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
