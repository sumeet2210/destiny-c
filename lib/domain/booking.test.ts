import { describe, expect, it } from 'vitest';
import { BOOKING } from '@/config/booking';
import {
  canCancel,
  canConfirm,
  canReview,
  isReminderDue,
  reminderWindowMinutes,
  resolve,
  validateLeadTime,
  type BookingLike,
} from './booking';

const NOW = new Date('2026-08-07T12:00:00Z');
const mins = (n: number) => new Date(NOW.getTime() + n * 60_000);

const booking = (overrides: Partial<BookingLike> = {}): BookingLike => ({
  status: 'confirmed',
  booking_time: mins(120).toISOString(),
  reminder_sent_at: null,
  confirmed_at: null,
  ...overrides,
});

describe('validateLeadTime (rule 1: 1-hour minimum, server is source of truth)', () => {
  it('accepts a booking exactly at the lead time boundary', () => {
    expect(validateLeadTime(mins(BOOKING.minLeadTimeMinutes), NOW).ok).toBe(
      true,
    );
  });

  it('rejects one minute under the lead time', () => {
    const r = validateLeadTime(mins(BOOKING.minLeadTimeMinutes - 1), NOW);
    expect(r.ok).toBe(false);
  });

  it('rejects past times and invalid dates', () => {
    expect(validateLeadTime(mins(-10), NOW).ok).toBe(false);
    expect(validateLeadTime(new Date('nope'), NOW).ok).toBe(false);
  });
});

describe('reminderWindowMinutes (rule 5: tighten, never ban)', () => {
  it('uses the normal window below the threshold', () => {
    expect(reminderWindowMinutes(0)).toBe(BOOKING.reminderWindowMinutes);
    expect(reminderWindowMinutes(BOOKING.noShowThreshold - 1)).toBe(
      BOOKING.reminderWindowMinutes,
    );
  });

  it('tightens at and past the threshold', () => {
    expect(reminderWindowMinutes(BOOKING.noShowThreshold)).toBe(
      BOOKING.tightenedReminderWindowMinutes,
    );
  });
});

describe('isReminderDue (rule 2: tied to booking_time - window, sent by sweep)', () => {
  it('not due before the window opens', () => {
    const b = booking({ booking_time: mins(45).toISOString() });
    expect(isReminderDue(b, 0, NOW)).toBe(false);
  });

  it('due once inside the window', () => {
    const b = booking({ booking_time: mins(25).toISOString() });
    expect(isReminderDue(b, 0, NOW)).toBe(true);
  });

  it('a repeat no-shower gets the tightened window', () => {
    const b = booking({ booking_time: mins(25).toISOString() });
    // 25 min out: inside the normal 30-min window, outside the tightened 10-min one.
    expect(isReminderDue(b, BOOKING.noShowThreshold, NOW)).toBe(false);
    const closer = booking({ booking_time: mins(8).toISOString() });
    expect(isReminderDue(closer, BOOKING.noShowThreshold, NOW)).toBe(true);
  });

  it('never re-sends', () => {
    const b = booking({
      booking_time: mins(20).toISOString(),
      reminder_sent_at: NOW.toISOString(),
    });
    expect(isReminderDue(b, 0, NOW)).toBe(false);
  });

  it('not due after booking_time (resolution owns that)', () => {
    const b = booking({ booking_time: mins(-5).toISOString() });
    expect(isReminderDue(b, 0, NOW)).toBe(false);
  });

  it('only confirmed bookings get reminders', () => {
    const b = booking({
      status: 'cancelled',
      booking_time: mins(20).toISOString(),
    });
    expect(isReminderDue(b, 0, NOW)).toBe(false);
  });
});

describe('canConfirm', () => {
  it('true between reminder and booking time', () => {
    const b = booking({
      booking_time: mins(20).toISOString(),
      reminder_sent_at: NOW.toISOString(),
    });
    expect(canConfirm(b, NOW)).toBe(true);
  });

  it('false before the reminder went out', () => {
    expect(canConfirm(booking(), NOW)).toBe(false);
  });

  it('false after booking time or when already confirmed', () => {
    const past = booking({
      booking_time: mins(-1).toISOString(),
      reminder_sent_at: NOW.toISOString(),
    });
    expect(canConfirm(past, NOW)).toBe(false);
    const done = booking({
      booking_time: mins(20).toISOString(),
      reminder_sent_at: NOW.toISOString(),
      confirmed_at: NOW.toISOString(),
    });
    expect(canConfirm(done, NOW)).toBe(false);
  });
});

describe('canCancel', () => {
  it('students can cancel upcoming bookings', () => {
    expect(canCancel(booking(), NOW)).toBe(true);
  });

  it('cannot cancel resolved or past bookings', () => {
    expect(canCancel(booking({ status: 'completed' }), NOW)).toBe(false);
    expect(
      canCancel(booking({ booking_time: mins(-1).toISOString() }), NOW),
    ).toBe(false);
  });
});

describe('resolve (rule 3: unconfirmed, never cancelled)', () => {
  it('does nothing before booking time', () => {
    expect(resolve(booking(), NOW)).toEqual({ action: 'none' });
  });

  it('marks unconfirmed (and counts the no-show) at booking time without confirmation', () => {
    const b = booking({ booking_time: mins(-1).toISOString() });
    expect(resolve(b, NOW)).toEqual({
      action: 'mark_unconfirmed',
      incrementNoShow: true,
    });
  });

  it('a confirmed visit skips unconfirmed and completes after the grace', () => {
    const confirmed = booking({
      booking_time: mins(-30).toISOString(),
      confirmed_at: mins(-40).toISOString(),
    });
    expect(resolve(confirmed, NOW)).toEqual({ action: 'none' });

    const over = booking({
      booking_time: mins(-BOOKING.completionGraceMinutes).toISOString(),
      confirmed_at: mins(-200).toISOString(),
    });
    expect(resolve(over, NOW)).toEqual({ action: 'mark_completed' });
  });

  it('an unconfirmed booking also completes after the grace — it still happened', () => {
    const b = booking({
      status: 'unconfirmed',
      booking_time: mins(-BOOKING.completionGraceMinutes - 1).toISOString(),
    });
    expect(resolve(b, NOW)).toEqual({ action: 'mark_completed' });
  });

  it('never touches cancelled bookings', () => {
    const b = booking({
      status: 'cancelled',
      booking_time: mins(-500).toISOString(),
    });
    expect(resolve(b, NOW)).toEqual({ action: 'none' });
  });
});

describe('canReview (rule 6 + PRD §5.8: verified, non-no-show visits only)', () => {
  it('allows completed + confirmed', () => {
    expect(
      canReview(
        booking({ status: 'completed', confirmed_at: NOW.toISOString() }),
      ),
    ).toBe(true);
  });

  it('blocks completed no-shows (PRD wins over architecture §4)', () => {
    expect(
      canReview(booking({ status: 'completed', confirmed_at: null })),
    ).toBe(false);
  });

  it('blocks anything not completed', () => {
    expect(canReview(booking({ confirmed_at: NOW.toISOString() }))).toBe(false);
  });
});
