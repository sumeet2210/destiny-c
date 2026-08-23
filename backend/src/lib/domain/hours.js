// Open-now logic. Pure, no network. Server-shaping subset of the Next app's
// lib/domain/hours.ts — mirrors the SQL is_open_now() in
// supabase/migrations/20260807100002. The booking-picker/formatting helpers
// (bookingDayOptions/formatDayShifts/DAY_LABELS/WEEK) stay client-side in Next.
//
// opening_hours shape:
//   { "mon": [{ "open": "11:00", "close": "23:00" }], "sun": [] }
// Times are local wall-clock Asia/Kolkata. close < open runs past midnight.
// Empty array or missing key means closed that day.

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// IST is fixed UTC+5:30, no DST — a constant offset is safe and keeps this pure.
const IST_OFFSET_MINUTES = 330;

/** Minutes since local midnight, and local day index (0=sun), in Asia/Kolkata. */
function istClock(at) {
  const utcMinutes = Math.floor(at.getTime() / 60_000);
  const istMinutes = utcMinutes + IST_OFFSET_MINUTES;
  const minutes = ((istMinutes % 1440) + 1440) % 1440;
  // 1970-01-01 was a Thursday (day 4).
  const day = (Math.floor(istMinutes / 1440) + 4) % 7;
  return { day, minutes };
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isOpenAt(hours, at) {
  if (!hours) return false;
  const { day, minutes } = istClock(at);
  const today = DAY_KEYS[day];
  const yesterday = DAY_KEYS[(day + 6) % 7];

  for (const shift of hours[today] ?? []) {
    const open = toMinutes(shift.open);
    const close = toMinutes(shift.close);
    if (close > open) {
      if (minutes >= open && minutes < close) return true;
    } else if (close < open) {
      // Runs past midnight: open from `open` until 24:00 today.
      if (minutes >= open) return true;
    }
  }

  // Yesterday's shifts that spilled past midnight into this morning.
  for (const shift of hours[yesterday] ?? []) {
    const open = toMinutes(shift.open);
    const close = toMinutes(shift.close);
    if (close < open && minutes < close) return true;
  }

  return false;
}

export const isOpenNow = (hours) => isOpenAt(hours, new Date());

/** Whether the restaurant has any scheduled service on the IST calendar day. */
export function isOpenToday(hours, at = new Date()) {
  if (!hours) return false;
  const { day } = istClock(at);
  return (hours[DAY_KEYS[day]] ?? []).length > 0;
}

/**
 * Minutes until the current shift closes, or null when closed (or when the
 * shift runs past midnight and the close is still on the far side).
 * Powers "closing soon".
 */
export function minutesUntilClose(hours, at) {
  if (!hours) return null;
  const { day, minutes } = istClock(at);
  const today = DAY_KEYS[day];
  const yesterday = DAY_KEYS[(day + 6) % 7];

  for (const shift of hours[today] ?? []) {
    const open = toMinutes(shift.open);
    const close = toMinutes(shift.close);
    if (close > open && minutes >= open && minutes < close)
      return close - minutes;
    if (close < open && minutes >= open) return 1440 - minutes + close;
  }
  for (const shift of hours[yesterday] ?? []) {
    const open = toMinutes(shift.open);
    const close = toMinutes(shift.close);
    if (close < open && minutes < close) return close - minutes;
  }
  return null;
}
