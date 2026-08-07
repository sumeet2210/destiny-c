// Open-now logic. Pure, no React, no network (rule 0.4). Mirrors the SQL
// function is_open_now() in supabase/migrations/20260807100002 — if one
// changes, change both and the tests.
//
// opening_hours shape (architecture.md §2):
//   { "mon": [{ "open": "11:00", "close": "23:00" }], "sun": [] }
// Times are local wall-clock Asia/Kolkata. close < open runs past midnight.
// Empty array or missing key means closed that day.

export type Shift = { open: string; close: string };
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type OpeningHours = Partial<Record<DayKey, Shift[]>>;

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// IST is fixed UTC+5:30, no DST — a constant offset is safe and keeps this pure.
const IST_OFFSET_MINUTES = 330;

/** Minutes since local midnight, and local day index (0=sun), in Asia/Kolkata. */
function istClock(at: Date): { day: number; minutes: number } {
  const utcMinutes = Math.floor(at.getTime() / 60_000);
  const istMinutes = utcMinutes + IST_OFFSET_MINUTES;
  const minutes = ((istMinutes % 1440) + 1440) % 1440;
  // 1970-01-01 was a Thursday (day 4).
  const day = (Math.floor(istMinutes / 1440) + 4) % 7;
  return { day, minutes };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isOpenAt(
  hours: OpeningHours | null | undefined,
  at: Date,
): boolean {
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

export const isOpenNow = (hours: OpeningHours | null | undefined) =>
  isOpenAt(hours, new Date());

/**
 * Minutes until the current shift closes, or null when closed (or when the
 * shift runs past midnight and the close is still on the far side).
 * Powers "closing soon" — the only surface allowed accent-urgent besides
 * offer countdowns (design.md §1).
 */
export function minutesUntilClose(
  hours: OpeningHours | null | undefined,
  at: Date,
): number | null {
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

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hr}${ampm}`
    : `${hr}:${String(m).padStart(2, '0')}${ampm}`;
};

/** "11:30am – 11:30pm" / "7am – 11:30am, 5pm – 10pm" / "Closed" */
export function formatDayShifts(shifts: Shift[] | undefined): string {
  if (!shifts || shifts.length === 0) return 'Closed';
  return shifts.map((s) => `${fmt(s.open)} – ${fmt(s.close)}`).join(', ');
}

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const WEEK: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
