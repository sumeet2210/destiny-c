// P6-1: the booking state machine. Pure functions, no React, no network
// (rule 0.4). The enforceable rules live in the booking-flow skill and
// architecture.md §4 — this file must match them exactly.
//
//   requested → confirmed or cancelled (restaurant owner decision)
//     at booking_time - window → reminder sent
//     student confirms  → confirmed_at set, stays 'confirmed'
//     no response       → 'unconfirmed' (never 'cancelled'), no_show_count += 1
//   after booking_time + grace → 'completed' (confirmed or unconfirmed),
//   which unlocks review-write for that booking.

import { BOOKING } from '@/config/booking';

export type BookingStatus =
  'requested' | 'confirmed' | 'unconfirmed' | 'completed' | 'cancelled';

export type BookingLike = {
  status: BookingStatus;
  booking_time: string;
  booking_end_time?: string | null;
  reminder_sent_at: string | null;
  confirmed_at: string | null;
};

const minutes = (ms: number) => ms / 60_000;

/** Rule 1: 1-hour minimum lead time, checked client-side AND server-side. */
export function validateLeadTime(
  bookingTime: Date,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: string } {
  if (Number.isNaN(bookingTime.getTime())) {
    return { ok: false, reason: 'Pick a valid date and time.' };
  }
  if (
    minutes(bookingTime.getTime() - now.getTime()) < BOOKING.minLeadTimeMinutes
  ) {
    return {
      ok: false,
      reason: `Bookings need at least ${BOOKING.minLeadTimeMinutes} minutes notice so the owner actually sees it coming.`,
    };
  }
  return { ok: true };
}

export function validateBookingWindow(
  bookingTime: Date,
  bookingEndTime: Date,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: string } {
  const startCheck = validateLeadTime(bookingTime, now);
  if (!startCheck.ok) return startCheck;

  if (Number.isNaN(bookingEndTime.getTime())) {
    return { ok: false, reason: 'Pick a valid end time.' };
  }

  if (bookingEndTime.getTime() <= bookingTime.getTime()) {
    return {
      ok: false,
      reason: 'The end time needs to be after the start time.',
    };
  }

  return { ok: true };
}

/**
 * Rule 5: past the no-show threshold the confirmation window tightens —
 * the reminder goes out closer to the booking, never a ban.
 */
export function reminderWindowMinutes(noShowCount: number): number {
  return noShowCount >= BOOKING.noShowThreshold
    ? BOOKING.tightenedReminderWindowMinutes
    : BOOKING.reminderWindowMinutes;
}

/** Rule 2: the reminder is due at exactly booking_time - window, sent by the sweep. */
export function isReminderDue(
  booking: BookingLike,
  noShowCount: number,
  now: Date = new Date(),
): boolean {
  if (booking.status !== 'confirmed') return false;
  if (booking.reminder_sent_at !== null) return false;
  const bookingTime = new Date(booking.booking_time).getTime();
  if (now.getTime() >= bookingTime) return false; // too late; resolution handles it
  return (
    now.getTime() >= bookingTime - reminderWindowMinutes(noShowCount) * 60_000
  );
}

/** The student can confirm from the reminder until booking_time. */
export function canConfirm(
  booking: BookingLike,
  now: Date = new Date(),
): boolean {
  return (
    booking.status === 'confirmed' &&
    booking.confirmed_at === null &&
    booking.reminder_sent_at !== null &&
    now.getTime() < new Date(booking.booking_time).getTime()
  );
}

/** Students may cancel any upcoming booking that hasn't resolved. */
export function canCancel(
  booking: BookingLike,
  now: Date = new Date(),
): boolean {
  return (
    (booking.status === 'requested' || booking.status === 'confirmed') &&
    now.getTime() < new Date(booking.booking_time).getTime()
  );
}

export type Resolution =
  | { action: 'none' }
  | { action: 'mark_unconfirmed'; incrementNoShow: true }
  | { action: 'mark_completed' };

/**
 * Rule 3: no auto-cancel. At booking_time with no confirmation the booking
 * becomes 'unconfirmed' — "likely no-show", the owner still expects them.
 * After the dwell grace it completes either way, unlocking reviews (rule 6).
 */
export function resolve(
  booking: BookingLike,
  now: Date = new Date(),
): Resolution {
  const bookingTime = new Date(booking.booking_time).getTime();
  const pastBooking = now.getTime() >= bookingTime;
  const pastGrace =
    now.getTime() >= bookingTime + BOOKING.completionGraceMinutes * 60_000;

  if (
    booking.status === 'confirmed' &&
    pastBooking &&
    booking.confirmed_at === null
  ) {
    return { action: 'mark_unconfirmed', incrementNoShow: true };
  }
  if (
    (booking.status === 'confirmed' || booking.status === 'unconfirmed') &&
    pastGrace
  ) {
    return { action: 'mark_completed' };
  }
  return { action: 'none' };
}

/**
 * Rule 6 + PRD §5.8: reviews are gated to verified visits — completed AND
 * confirmed. (architecture.md §4 unlocks reviews for any completed booking;
 * the PRD's "booked and didn't no-show" wins — see docs/decisions.md.)
 */
export function canReview(booking: BookingLike): boolean {
  return booking.status === 'completed' && booking.confirmed_at !== null;
}

export function formatBookingWindow(
  bookingTime: string,
  bookingEndTime?: string | null,
): string {
  const start = new Date(bookingTime);
  const startText = start.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  if (!bookingEndTime) return startText;

  const end = new Date(bookingEndTime);
  return `${startText} – ${end.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })}`;
}

/**
 * Rule 4 lives in copy as much as code: statuses phrase what the owner knows,
 * never what the platform guarantees.
 */
export const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Awaiting owner',
  confirmed: 'Accepted by owner',
  unconfirmed: 'Likely no-show',
  completed: 'Visit over',
  cancelled: 'Cancelled',
};
