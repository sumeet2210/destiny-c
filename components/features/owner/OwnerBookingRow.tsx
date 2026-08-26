'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { BookingStatus } from '@/lib/domain/booking';
import { respondToBooking, setOwnerNote } from '@/lib/bookings/actions';
import { cn } from '@/lib/cn';

// Owner-facing status copy: what the owner knows, not what's promised.
const ownerStatus: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: 'Incoming', tone: 'text-text-muted' },
  confirmed: { label: 'Coming', tone: 'text-accent-secondary' },
  unconfirmed: { label: 'Likely no-show', tone: 'text-accent-urgent-text' },
  completed: { label: 'Past', tone: 'text-text-muted' },
  cancelled: { label: 'Cancelled', tone: 'text-text-muted' },
};

export function OwnerBookingRow({
  booking,
}: {
  booking: {
    id: string;
    studentName: string | null;
    studentNoShows: number;
    booking_time: string;
    headcount: number;
    special_request: string | null;
    status: BookingStatus;
    confirmed_at: string | null;
    owner_note: string | null;
    offerTitle: string | null;
    eventTitle: string | null;
  };
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(booking.owner_note ?? '');
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const meta = ownerStatus[booking.status];
  const display =
    booking.status === 'confirmed' && booking.confirmed_at
      ? { label: 'Confirmed coming', tone: 'text-accent-secondary' }
      : meta;

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-paper text-sm font-semibold">
          {booking.studentName ?? 'A student'}
          <span className="text-accent-primary ml-2 font-mono text-[13px]">
            {booking.headcount} pax
          </span>
        </p>
        <span className={cn('text-[12px]', display.tone)}>{display.label}</span>
      </div>
      <p className="text-text-muted font-mono text-[13px]">
        {new Date(booking.booking_time).toLocaleString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        })}
      </p>
      {booking.special_request && (
        <p className="text-paper text-[13px]">“{booking.special_request}”</p>
      )}
      {booking.offerTitle && (
        <p className="text-text-muted text-[12px]">
          Offer: <span className="text-paper">{booking.offerTitle}</span>
        </p>
      )}
      {booking.eventTitle && (
        <p className="text-text-muted text-[12px]">
          Event: <span className="text-paper">{booking.eventTitle}</span>
        </p>
      )}
      {booking.studentNoShows >= 3 && (
        <p className="text-text-muted text-[12px]">
          Has missed a few confirmations before — take the headcount as a maybe.
        </p>
      )}

      {booking.status === 'requested' && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await respondToBooking(booking.id, 'accept');
                toast(
                  res.ok ? 'Reservation accepted' : (res.message ?? 'Failed'),
                  res.ok ? 'positive' : 'error',
                );
              })
            }
          >
            Accept
          </Button>
          <Button
            variant="urgent-text"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await respondToBooking(booking.id, 'reject');
                toast(
                  res.ok ? 'Reservation rejected' : (res.message ?? 'Failed'),
                  res.ok ? 'default' : 'error',
                );
              })
            }
          >
            Reject
          </Button>
        </div>
      )}

      {booking.owner_note && !noteOpen && (
        <p className="rounded-control bg-surface-raised text-text-muted p-2 text-[13px]">
          Your note: <span className="text-paper">{booking.owner_note}</span>
        </p>
      )}

      {noteOpen ? (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. We're full till 9, happy to seat you after."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await setOwnerNote(booking.id, note);
                  toast(
                    res.ok ? 'Note sent' : (res.message ?? 'Failed'),
                    res.ok ? 'positive' : 'error',
                  );
                  if (res.ok) setNoteOpen(false);
                })
              }
            >
              Save note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNoteOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}>
          {booking.owner_note ? 'Edit note' : 'Leave a note'}
        </Button>
      )}
    </Card>
  );
}
