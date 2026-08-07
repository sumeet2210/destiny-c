'use client';

// P6-2: date/time, headcount, special request, client-side lead-time check.
// Copy rule (P6-11): everything says "letting the owner know", never
// "table reserved".

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BOOKING } from '@/config/booking';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { validateLeadTime } from '@/lib/domain/booking';

export function BookingForm({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Card className="space-y-2 text-center">
        <p aria-hidden className="text-3xl">
          🎉
        </p>
        <p className="text-paper text-sm font-medium">
          {restaurantName} knows you&apos;re likely coming.
        </p>
        <p className="text-text-muted text-[13px]">
          We&apos;ll nudge you {BOOKING.reminderWindowMinutes} minutes before to
          confirm you&apos;re still on. If plans change, cancel from your
          bookings page — it keeps the signal honest.
        </p>
        <Button
          className="mt-2 w-full"
          onClick={() => router.push('/bookings')}
        >
          My bookings
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const when = new Date(String(fd.get('booking_time')));

          const check = validateLeadTime(when);
          if (!check.ok) {
            setError(check.reason);
            return;
          }

          setError(null);
          setSubmitting(true);
          try {
            const res = await fetch('/api/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                restaurantId,
                bookingTime: when.toISOString(),
                headcount: Number(fd.get('headcount')),
                specialRequest: String(fd.get('special_request') || ''),
              }),
            });
            const data = await res.json();
            if (!data.ok) setError(data.error ?? 'Could not send that.');
            else setDone(true);
          } catch {
            setError('Network hiccup — try again.');
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="bk-time">When are you going?</Label>
          <Input
            id="bk-time"
            name="booking_time"
            type="datetime-local"
            required
            className="font-mono"
          />
          <p className="text-text-muted mt-1 text-[11px]">
            At least {BOOKING.minLeadTimeMinutes} minutes from now, so the owner
            actually sees it coming.
          </p>
        </div>
        <div>
          <Label htmlFor="bk-headcount">How many of you?</Label>
          <Select
            id="bk-headcount"
            name="headcount"
            defaultValue="2"
            className="font-mono"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="bk-request">
            Anything they should know? (optional)
          </Label>
          <Textarea
            id="bk-request"
            name="special_request"
            placeholder="Birthday table, veg-only group, window seat if possible…"
          />
        </div>
        {error && (
          <p className="text-accent-urgent-text text-[13px]">{error}</p>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Sending…' : 'Send the heads-up'}
        </Button>
      </form>
    </Card>
  );
}
