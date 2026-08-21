'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label, Textarea } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { validateBookingWindow } from '@/lib/domain/booking';
import type { BookingDayOption } from '@/lib/domain/hours';
import { cn } from '@/lib/cn';

const IST_OFFSET_MINUTES = 330;
const MAX_HEADCOUNT = 15;

export type BookingExtra = {
  id: string;
  title: string;
  description: string | null;
  detail: string;
};

type BookingExperienceSelection = {
  kind: 'offer' | 'event';
  id: string;
};

export function BookingForm({
  restaurantId,
  restaurantName,
  bookingDays,
  bookForLater,
  offers,
  events,
}: {
  restaurantId: string;
  restaurantName: string;
  bookingDays: BookingDayOption[];
  bookForLater: boolean;
  offers: BookingExtra[];
  events: BookingExtra[];
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    () => bookingDays[0]?.date ?? '',
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    () => bookingDays[0]?.slots[0] ?? '',
  );
  const [headcount, setHeadcount] = useState(2);
  const [specialRequest, setSpecialRequest] = useState('');
  const [experience, setExperience] =
    useState<BookingExperienceSelection | null>(null);
  const [picker, setPicker] = useState<'offer' | 'event' | null>(null);
  const [step, setStep] = useState<'details' | 'review' | 'done'>('details');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDay = useMemo(
    () => bookingDays.find((day) => day.date === selectedDate),
    [bookingDays, selectedDate],
  );
  const selectedOffer =
    experience?.kind === 'offer'
      ? offers.find((offer) => offer.id === experience.id)
      : undefined;
  const selectedEvent =
    experience?.kind === 'event'
      ? events.find((event) => event.id === experience.id)
      : undefined;

  const bookingWindow = () => {
    const when = parseIstDateTime(`${selectedDate}T${selectedStartTime}`);
    const until = new Date(when.getTime() + 60 * 60_000);
    return { when, until };
  };

  const reviewBooking = () => {
    if (!selectedDate || !selectedStartTime) {
      setError('Choose an available date and time slot.');
      return;
    }
    const { when, until } = bookingWindow();
    const check = validateBookingWindow(when, until);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setError(null);
    setStep('review');
  };

  const submitBooking = async () => {
    const { when, until } = bookingWindow();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          bookingTime: when.toISOString(),
          bookingEndTime: until.toISOString(),
          headcount,
          specialRequest,
          offerId: experience?.kind === 'offer' ? experience.id : null,
          eventId: experience?.kind === 'event' ? experience.id : null,
        }),
      });
      const data = await response.json();
      if (!data.ok) setError(data.error ?? 'Could not place that reservation.');
      else setStep('done');
    } catch {
      setError('Network hiccup — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <Card className="space-y-3 text-center">
        <SuccessIcon />
        <div>
          <h2 className="text-paper text-lg font-extrabold">
            Reservation sent successfully
          </h2>
          <p className="text-text-muted mt-1 text-[13px]">
            {restaurantName} can now accept or reject your request. We&apos;ll
            show the owner&apos;s decision in My bookings.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push('/bookings')}>
          View my bookings
        </Button>
      </Card>
    );
  }

  if (step === 'review') {
    return (
      <Card className="space-y-4">
        <div>
          <p className="text-accent-primary text-[11px] font-extrabold tracking-[0.12em] uppercase">
            Review reservation
          </p>
          <h2 className="text-paper mt-1 text-lg font-extrabold">
            Everything look right?
          </h2>
        </div>
        <div className="divide-border-hairline divide-y">
          <ReviewRow label="Restaurant" value={restaurantName} />
          <ReviewRow label="Date" value={selectedDay?.detail ?? selectedDate} />
          <ReviewRow label="Time" value={formatSlot(selectedStartTime)} />
          <ReviewRow label="Squad members" value={String(headcount)} />
          {selectedOffer && (
            <ReviewRow label="Special offer" value={selectedOffer.title} />
          )}
          {selectedEvent && (
            <ReviewRow label="Event" value={selectedEvent.title} />
          )}
          {specialRequest.trim() && (
            <ReviewRow label="Requests" value={specialRequest.trim()} />
          )}
        </div>
        {error && (
          <p className="text-accent-urgent-text text-[13px]">{error}</p>
        )}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button variant="outline" onClick={() => setStep('details')}>
            Edit
          </Button>
          <Button disabled={submitting} onClick={submitBooking}>
            {submitting ? 'Confirming…' : 'Confirm booking'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="space-y-5">
        <section className="relative overflow-hidden rounded-[1.15rem] border border-[#1DB954]/35 bg-[radial-gradient(circle_at_92%_0%,rgba(29,185,84,0.22),transparent_38%),linear-gradient(145deg,#202020,#111)] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
          <div className="relative mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.13em] text-[#1DB954] uppercase">
                Add to your table
              </p>
              <h2 className="text-paper mt-0.5 text-base font-extrabold">
                Choose one experience
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-white/55">
              Optional
            </span>
          </div>
          <p className="relative mb-2.5 text-[11px] leading-relaxed text-white/55">
            Select either one restaurant offer or one event for this booking.
          </p>
          <div className="relative grid grid-cols-2 gap-2">
            <ExtraButton
              label="Special offer"
              selected={selectedOffer?.title}
              active={Boolean(selectedOffer)}
              disabled={offers.length === 0 || experience?.kind === 'event'}
              locked={experience?.kind === 'event'}
              onClick={() => setPicker('offer')}
            />
            <ExtraButton
              label="Event"
              selected={selectedEvent?.title}
              active={Boolean(selectedEvent)}
              disabled={events.length === 0 || experience?.kind === 'offer'}
              locked={experience?.kind === 'offer'}
              onClick={() => setPicker('event')}
            />
          </div>
          {(selectedOffer || selectedEvent) && (
            <div className="relative mt-2.5 flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-semibold text-[#1DB954]">
                Selected: {(selectedOffer ?? selectedEvent)?.title}
              </p>
              <button
                type="button"
                className="shrink-0 text-[9px] font-extrabold text-white/55 underline underline-offset-2 hover:text-white"
                onClick={() => setExperience(null)}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <div>
          <Label>Choose a date</Label>
          <div
            className="no-scrollbar mt-1 flex gap-2 overflow-x-auto pb-1"
            aria-label="Available booking dates"
          >
            {bookingDays.map((day) => {
              const active = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedStartTime(day.slots[0] ?? '');
                  }}
                  className={cn(
                    'rounded-control min-w-[4.75rem] shrink-0 border px-3 py-2 text-center text-xs font-semibold transition-colors',
                    active
                      ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
                      : 'border-border-hairline bg-surface-muted text-text-muted hover:text-paper',
                  )}
                >
                  <span className="block">{day.label}</span>
                  <span className="mt-0.5 block text-[10px] opacity-75">
                    {day.detail}
                  </span>
                  <span className="mt-0.5 block text-[10px] opacity-75">
                    {day.hours}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <fieldset>
          <legend className="text-paper text-[13px] font-semibold">
            Choose a one-hour time slot
          </legend>
          {selectedDay?.slots.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selectedStartTime === slot}
                  className={cn(
                    'rounded-control min-h-10 border px-2 font-mono text-xs font-bold transition-colors',
                    selectedStartTime === slot
                      ? 'border-accent-primary bg-accent-primary text-ink-on-primary'
                      : 'border-border-hairline bg-surface-muted text-text-muted hover:text-paper',
                  )}
                  onClick={() => setSelectedStartTime(slot)}
                >
                  {formatSlot(slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-text-muted mt-2 text-[13px]">
              No bookable one-hour slots are available.
            </p>
          )}
          {bookForLater && (
            <p className="text-text-muted mt-2 text-[11px]">
              Today is skipped — the next open day is selected for you.
            </p>
          )}
        </fieldset>

        <div>
          <Label>Squad members</Label>
          <div className="border-border-hairline bg-surface-muted mt-1 grid grid-cols-[3rem_1fr_3rem] items-center rounded-full border p-1">
            <button
              type="button"
              aria-label="Remove one squad member"
              disabled={headcount === 1}
              onClick={() =>
                setHeadcount((current) => Math.max(1, current - 1))
              }
              className="bg-surface-raised text-paper grid size-10 place-items-center rounded-full text-xl disabled:cursor-not-allowed disabled:opacity-35"
            >
              −
            </button>
            <output className="text-paper text-center font-mono text-lg font-extrabold">
              {headcount}
            </output>
            <button
              type="button"
              aria-label="Add one squad member"
              disabled={headcount === MAX_HEADCOUNT}
              onClick={() =>
                setHeadcount((current) => Math.min(MAX_HEADCOUNT, current + 1))
              }
              className="bg-surface-raised text-paper grid size-10 place-items-center rounded-full text-xl disabled:cursor-not-allowed disabled:opacity-35"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="bk-request">Add a special request (optional)</Label>
          <Textarea
            id="bk-request"
            value={specialRequest}
            maxLength={500}
            onChange={(event) => setSpecialRequest(event.target.value)}
            placeholder="Birthday table, veg-only group, window seat if possible…"
          />
        </div>
        {error && (
          <p className="text-accent-urgent-text text-[13px]">{error}</p>
        )}
        <Button
          type="button"
          disabled={!selectedDay?.slots.length}
          className="w-full"
          size="lg"
          onClick={reviewBooking}
        >
          Reserve table
        </Button>
      </Card>

      <ChoiceSheet
        kind={picker}
        items={picker === 'offer' ? offers : events}
        selectedId={experience?.kind === picker ? experience.id : null}
        onSelect={(id) => {
          setExperience(id && picker ? { kind: picker, id } : null);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </>
  );
}

function ExtraButton({
  label,
  selected,
  active,
  disabled,
  locked,
  onClick,
}: {
  label: string;
  selected?: string;
  active: boolean;
  disabled: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-control text-paper relative min-h-[4.4rem] overflow-hidden border p-3 text-left transition-[border-color,background,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35',
        active
          ? 'border-[#1DB954] bg-[#1DB954]/12 shadow-[inset_0_0_0_1px_rgba(29,185,84,0.18)]'
          : 'border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.07]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mb-2 block h-1 w-7 rounded-full transition-[width,background]',
          active ? 'w-11 bg-[#1DB954]' : 'bg-white/20',
        )}
      />
      <strong className="block text-xs">{label}</strong>
      <span className="text-text-muted mt-1 block truncate text-[10px]">
        {locked
          ? 'Clear current choice to switch'
          : disabled
            ? 'None available'
            : (selected ?? 'Tap to explore')}
      </span>
    </button>
  );
}

function ChoiceSheet({
  kind,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  kind: 'offer' | 'event' | null;
  items: BookingExtra[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={kind !== null}
      onClose={onClose}
      title={kind === 'offer' ? 'Choose a special offer' : 'Choose an event'}
    >
      <div className="space-y-2">
        <button
          type="button"
          aria-pressed={selectedId === null}
          className="rounded-control border-border-hairline text-text-muted w-full border p-3 text-left text-xs"
          onClick={() => onSelect(null)}
        >
          No selection
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selectedId === item.id}
            className={cn(
              'rounded-control w-full border p-3 text-left',
              selectedId === item.id
                ? 'border-accent-primary bg-accent-primary/10'
                : 'border-border-hairline bg-surface-muted',
            )}
            onClick={() => onSelect(item.id)}
          >
            <strong className="text-paper block text-sm">{item.title}</strong>
            <span className="text-accent-primary mt-1 block text-[11px] font-bold">
              {item.detail}
            </span>
            {item.description && (
              <span className="text-text-muted mt-1 block text-xs">
                {item.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 text-[13px]">
      <span className="text-text-muted">{label}</span>
      <strong className="text-paper text-right font-semibold">{value}</strong>
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="text-accent-primary mx-auto size-10 fill-none stroke-current stroke-2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" />
    </svg>
  );
}

function parseIstDateTime(value: string) {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MINUTES * 60_000,
  );
}

function formatSlot(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}
