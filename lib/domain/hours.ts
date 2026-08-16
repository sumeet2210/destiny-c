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

/** Whether the restaurant has any scheduled service on the IST calendar day. */
export function isOpenToday(
  hours: OpeningHours | null | undefined,
  at: Date = new Date(),
): boolean {
  if (!hours) return false;
  const { day } = istClock(at);
  return (hours[DAY_KEYS[day]] ?? []).length > 0;
}

export type BookingDayOption = {
  date: string;
  label: string;
  detail: string;
  defaultTime: string;
};

/** Upcoming open dates for the booking picker, expressed as IST wall time. */
export function bookingDayOptions(
  hours: OpeningHours | null | undefined,
  options: {
    at?: Date;
    skipToday?: boolean;
    leadTimeMinutes?: number;
    count?: number;
  } = {},
): BookingDayOption[] {
  if (!hours) return [];

  const at = options.at ?? new Date();
  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  const baseYear = shifted.getUTCFullYear();
  const baseMonth = shifted.getUTCMonth();
  const baseDate = shifted.getUTCDate();
  const currentMinutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const startOffset = options.skipToday ? 1 : 0;
  const leadTime = options.leadTimeMinutes ?? 0;
  const count = options.count ?? 7;
  const result: BookingDayOption[] = [];

  for (
    let offset = startOffset;
    offset < 21 && result.length < count;
    offset++
  ) {
    const calendarDate = new Date(
      Date.UTC(baseYear, baseMonth, baseDate + offset),
    );
    const shifts = [...(hours[DAY_KEYS[calendarDate.getUTCDay()]] ?? [])].sort(
      (a, b) => toMinutes(a.open) - toMinutes(b.open),
    );
    const earliestToday = roundUpToQuarterHour(currentMinutes + leadTime);
    const shift = shifts.find(({ open, close }) => {
      const opening = toMinutes(open);
      const closing = toMinutes(close);
      const end = closing > opening ? closing : 1440 + closing;
      const candidate =
        offset === 0 ? Math.max(opening, earliestToday) : opening;
      return candidate < end && candidate < 1440;
    });

    if (!shift) continue;

    const opening = toMinutes(shift.open);
    const defaultMinutes =
      offset === 0 ? Math.max(opening, earliestToday) : opening;
    const year = calendarDate.getUTCFullYear();
    const month = calendarDate.getUTCMonth() + 1;
    const date = calendarDate.getUTCDate();

    result.push({
      date: `${year}-${pad2(month)}-${pad2(date)}`,
      label:
        offset === 0
          ? 'Today'
          : offset === 1
            ? 'Tomorrow'
            : calendarDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                timeZone: 'UTC',
              }),
      detail: calendarDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
      defaultTime: `${pad2(Math.floor(defaultMinutes / 60))}:${pad2(defaultMinutes % 60)}`,
    });
  }

  return result;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

const roundUpToQuarterHour = (minutes: number) => Math.ceil(minutes / 15) * 15;

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
