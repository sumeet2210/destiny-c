// The booking state machine. Pure functions, no network. Port of the Next app's
// lib/domain/booking.ts — must match the booking-flow rules exactly. Display
// helpers (formatBookingWindow/STATUS_LABELS) stay client-side in Next.
//
//   requested → confirmed or cancelled (restaurant owner decision)
//     at booking_time - window → reminder sent
//     student confirms  → confirmed_at set, stays 'confirmed'
//     no response       → 'unconfirmed' (never 'cancelled'), no_show_count += 1
//   after booking_time + grace → 'completed' (confirmed or unconfirmed),
//   which unlocks review-write for that booking.

import { BOOKING } from '../../config/booking.js';

const minutes = (ms) => ms / 60_000;

/** Rule 1: 1-hour minimum lead time, checked client-side AND server-side. */
export function validateLeadTime(bookingTime, now = new Date()) {
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

export function validateBookingWindow(bookingTime, bookingEndTime, now = new Date()) {
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
export function reminderWindowMinutes(noShowCount) {
  return noShowCount >= BOOKING.noShowThreshold
    ? BOOKING.tightenedReminderWindowMinutes
    : BOOKING.reminderWindowMinutes;
}

/** Rule 2: the reminder is due at exactly booking_time - window, sent by the sweep. */
export function isReminderDue(booking, noShowCount, now = new Date()) {
  if (booking.status !== 'confirmed') return false;
  if (booking.reminder_sent_at !== null) return false;
  const bookingTime = new Date(booking.booking_time).getTime();
  if (now.getTime() >= bookingTime) return false; // too late; resolution handles it
  return (
    now.getTime() >= bookingTime - reminderWindowMinutes(noShowCount) * 60_000
  );
}

/** The student can confirm from the reminder until booking_time. */
export function canConfirm(booking, now = new Date()) {
  return (
    booking.status === 'confirmed' &&
    booking.confirmed_at === null &&
    booking.reminder_sent_at !== null &&
    now.getTime() < new Date(booking.booking_time).getTime()
  );
}

/** Students may cancel any upcoming booking that hasn't resolved. */
export function canCancel(booking, now = new Date()) {
  return (
    (booking.status === 'requested' || booking.status === 'confirmed') &&
    now.getTime() < new Date(booking.booking_time).getTime()
  );
}

/**
 * Rule 3: no auto-cancel. At booking_time with no confirmation the booking
 * becomes 'unconfirmed' — "likely no-show", the owner still expects them.
 * After the dwell grace it completes either way, unlocking reviews (rule 6).
 */
export function resolve(booking, now = new Date()) {
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
 * confirmed.
 */
export function canReview(booking) {
  return booking.status === 'completed' && booking.confirmed_at !== null;
}
