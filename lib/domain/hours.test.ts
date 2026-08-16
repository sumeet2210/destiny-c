import { describe, expect, it } from 'vitest';
import {
  bookingDayOptions,
  formatDayShifts,
  isOpenAt,
  isOpenToday,
  minutesUntilClose,
  type OpeningHours,
} from './hours';

// Helper: build a UTC Date for a given IST wall-clock moment.
// IST = UTC+5:30, so IST 12:00 == UTC 06:30.
function ist(dateIso: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(`${dateIso}T00:00:00+05:30`);
  d.setUTCMinutes(d.getUTCMinutes() + h * 60 + m);
  return d;
}

// 2026-08-03 is a Monday.
const MON = '2026-08-03';
const TUE = '2026-08-04';
const WED = '2026-08-05';
const SUN = '2026-08-09';

describe('isOpenAt', () => {
  const simple: OpeningHours = {
    mon: [{ open: '11:00', close: '23:00' }],
    sun: [],
  };

  it('is open inside the shift', () => {
    expect(isOpenAt(simple, ist(MON, '12:00'))).toBe(true);
  });

  it('is closed before opening and after closing', () => {
    expect(isOpenAt(simple, ist(MON, '10:59'))).toBe(false);
    expect(isOpenAt(simple, ist(MON, '23:00'))).toBe(false); // close is exclusive
  });

  it('opening minute is inclusive', () => {
    expect(isOpenAt(simple, ist(MON, '11:00'))).toBe(true);
  });

  it('empty array means closed that day', () => {
    expect(isOpenAt(simple, ist(SUN, '13:00'))).toBe(false);
  });

  it('missing day key means closed', () => {
    expect(isOpenAt(simple, ist(TUE, '13:00'))).toBe(false);
  });

  it('null hours means closed', () => {
    expect(isOpenAt(null, ist(MON, '12:00'))).toBe(false);
    expect(isOpenAt(undefined, ist(MON, '12:00'))).toBe(false);
  });

  describe('split shifts', () => {
    const split: OpeningHours = {
      mon: [
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ],
    };

    it('open during both shifts', () => {
      expect(isOpenAt(split, ist(MON, '08:00'))).toBe(true);
      expect(isOpenAt(split, ist(MON, '19:00'))).toBe(true);
    });

    it('closed in the afternoon gap', () => {
      expect(isOpenAt(split, ist(MON, '14:00'))).toBe(false);
    });
  });

  describe('past-midnight closes', () => {
    const late: OpeningHours = {
      mon: [{ open: '18:00', close: '02:00' }],
    };

    it('open late evening', () => {
      expect(isOpenAt(late, ist(MON, '23:30'))).toBe(true);
    });

    it("open after midnight — spills into Tuesday's early morning", () => {
      expect(isOpenAt(late, ist(TUE, '01:30'))).toBe(true);
    });

    it('closed after the spillover close', () => {
      expect(isOpenAt(late, ist(TUE, '02:00'))).toBe(false);
      expect(isOpenAt(late, ist(TUE, '03:00'))).toBe(false);
    });

    it('closed Tuesday evening (no Tuesday shift)', () => {
      expect(isOpenAt(late, ist(TUE, '20:00'))).toBe(false);
    });

    it('the spillover does not leak into Wednesday', () => {
      expect(isOpenAt(late, ist(WED, '01:30'))).toBe(false);
    });
  });
});

describe('minutesUntilClose', () => {
  const hours: OpeningHours = {
    mon: [{ open: '11:00', close: '23:00' }],
    tue: [{ open: '18:00', close: '02:00' }],
  };

  it('counts down within a normal shift', () => {
    expect(minutesUntilClose(hours, ist(MON, '22:30'))).toBe(30);
  });

  it('returns null when closed', () => {
    expect(minutesUntilClose(hours, ist(MON, '09:00'))).toBeNull();
  });

  it('spans midnight for late shifts', () => {
    expect(minutesUntilClose(hours, ist(TUE, '23:00'))).toBe(180);
  });

  it('counts down in the after-midnight spillover', () => {
    expect(minutesUntilClose(hours, ist(WED, '01:00'))).toBe(60);
  });
});

describe('booking availability', () => {
  const hours: OpeningHours = {
    mon: [{ open: '11:00', close: '23:00' }],
    tue: [],
    wed: [{ open: '17:00', close: '22:00' }],
  };

  it('reports whether the restaurant serves on the current IST day', () => {
    expect(isOpenToday(hours, ist(MON, '08:00'))).toBe(true);
    expect(isOpenToday(hours, ist(TUE, '08:00'))).toBe(false);
  });

  it('omits today and preselects the next scheduled day for later bookings', () => {
    const days = bookingDayOptions(hours, {
      at: ist(MON, '12:00'),
      skipToday: true,
      leadTimeMinutes: 60,
    });

    expect(days[0]).toMatchObject({
      date: WED,
      label: 'Wed',
      defaultTime: '17:00',
    });
    expect(days.some((day) => day.date === MON)).toBe(false);
  });

  it('keeps today when a valid booking time remains', () => {
    const days = bookingDayOptions(hours, {
      at: ist(MON, '09:00'),
      leadTimeMinutes: 60,
    });

    expect(days[0]).toMatchObject({
      date: MON,
      label: 'Today',
      defaultTime: '11:00',
    });
  });
});

describe('formatDayShifts', () => {
  it('formats a single shift', () => {
    expect(formatDayShifts([{ open: '11:00', close: '23:00' }])).toBe(
      '11am – 11pm',
    );
  });

  it('formats split shifts with minutes', () => {
    expect(
      formatDayShifts([
        { open: '07:00', close: '11:30' },
        { open: '17:00', close: '22:00' },
      ]),
    ).toBe('7am – 11:30am, 5pm – 10pm');
  });

  it('says Closed for empty or missing', () => {
    expect(formatDayShifts([])).toBe('Closed');
    expect(formatDayShifts(undefined)).toBe('Closed');
  });
});
