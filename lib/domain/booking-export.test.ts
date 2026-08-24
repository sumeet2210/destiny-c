import { describe, expect, it } from 'vitest';
import {
  BOOKING_EXPORT_HEADERS,
  bookingsToCsv,
  escapeCsvValue,
  formatIstTimestamp,
  type ExportableBooking,
} from './booking-export';

describe('escapeCsvValue', () => {
  it('leaves an ordinary value alone', () => {
    expect(escapeCsvValue('Priya Nair')).toBe('Priya Nair');
    expect(escapeCsvValue('')).toBe('');
    expect(escapeCsvValue('4')).toBe('4');
  });

  it('quotes a value containing a comma', () => {
    expect(escapeCsvValue('Nair, Priya')).toBe('"Nair, Priya"');
  });

  it('doubles and quotes embedded quotes', () => {
    expect(escapeCsvValue('the "window" table')).toBe('"the ""window"" table"');
  });

  it('keeps newlines, quoted, rather than dropping the rest of the note', () => {
    expect(escapeCsvValue('line one\nline two')).toBe('"line one\nline two"');
    expect(escapeCsvValue('line one\r\nline two')).toBe(
      '"line one\r\nline two"',
    );
  });

  it('neutralises every formula lead character', () => {
    expect(escapeCsvValue('=1+1')).toBe("'=1+1");
    expect(escapeCsvValue('+1')).toBe("'+1");
    expect(escapeCsvValue('-1')).toBe("'-1");
    expect(escapeCsvValue('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(escapeCsvValue('\tvalue')).toBe("'\tvalue");
    // A leading CR is both a formula lead and a reason to quote.
    expect(escapeCsvValue('\rvalue')).toBe('"\'\rvalue"');
  });

  it('neutralises and quotes a real injection payload', () => {
    // The classic case: a guest types this into a special request and the owner
    // opens the file in Excel.
    expect(escapeCsvValue('=HYPERLINK("http://evil.test","Click")')).toBe(
      '"\'=HYPERLINK(""http://evil.test"",""Click"")"',
    );
  });

  it('only treats the first character as a formula lead', () => {
    expect(escapeCsvValue('2+2 people')).toBe('2+2 people');
    expect(escapeCsvValue('table @ 8pm')).toBe('table @ 8pm');
  });
});

describe('formatIstTimestamp', () => {
  it('converts UTC to IST', () => {
    expect(formatIstTimestamp('2026-08-23T09:30:00Z')).toBe('2026-08-23 15:00');
  });

  it('rolls the date over when +5:30 crosses midnight', () => {
    expect(formatIstTimestamp('2026-08-23T19:00:00Z')).toBe('2026-08-24 00:30');
  });

  it('renders IST midnight as 00, never 24', () => {
    expect(formatIstTimestamp('2026-08-23T18:30:00Z')).toBe('2026-08-24 00:00');
  });

  it('respects an explicit offset in the input', () => {
    expect(formatIstTimestamp('2026-08-23T15:00:00+05:30')).toBe(
      '2026-08-23 15:00',
    );
  });

  it('renders a missing or unparseable timestamp as an empty cell', () => {
    expect(formatIstTimestamp(null)).toBe('');
    expect(formatIstTimestamp('')).toBe('');
    expect(formatIstTimestamp('not a date')).toBe('');
  });
});

const booking: ExportableBooking = {
  booking_time: '2026-08-23T09:30:00Z',
  studentName: 'Priya Nair',
  headcount: 4,
  status: 'confirmed',
  special_request: 'Window seat',
  offerTitle: '20% off thali',
  eventTitle: null,
  owner_note: 'Saved the corner table',
  confirmed_at: '2026-08-22T05:00:00Z',
};

const lines = (csv: string) => csv.split('\r\n');

describe('bookingsToCsv', () => {
  it('starts with the header row', () => {
    expect(lines(bookingsToCsv([]))[0]).toBe(BOOKING_EXPORT_HEADERS.join(','));
  });

  it('writes headers only when there is nothing to export', () => {
    expect(lines(bookingsToCsv([]))).toHaveLength(1);
  });

  it('writes one row per booking, in the order supplied', () => {
    const rows = lines(
      bookingsToCsv([
        booking,
        { ...booking, studentName: 'Aarav Sharma', status: 'requested' },
      ]),
    );
    expect(rows).toHaveLength(3);
    expect(rows[1]).toContain('Priya Nair');
    expect(rows[2]).toContain('Aarav Sharma');
  });

  it('writes one field per header', () => {
    const row = lines(
      bookingsToCsv([{ ...booking, offerTitle: 'Thali deal' }]),
    )[1];
    expect(row?.split(',')).toHaveLength(BOOKING_EXPORT_HEADERS.length);
  });

  it('exports the fields the owner already sees on screen', () => {
    expect(lines(bookingsToCsv([booking]))[1]).toBe(
      '2026-08-23 15:00,Priya Nair,4,confirmed,Window seat,20% off thali,,Saved the corner table,2026-08-22 10:30',
    );
  });

  it('renders every absent value as an empty cell', () => {
    const row = lines(
      bookingsToCsv([
        {
          ...booking,
          studentName: null,
          special_request: null,
          offerTitle: null,
          eventTitle: null,
          owner_note: null,
          confirmed_at: null,
        },
      ]),
    )[1];
    expect(row).toBe('2026-08-23 15:00,,4,confirmed,,,,,');
  });

  it('exports the raw status so it stays sortable', () => {
    expect(
      lines(bookingsToCsv([{ ...booking, status: 'cancelled' }]))[1],
    ).toContain(',cancelled,');
  });

  it('keeps columns aligned when a guest note contains a comma', () => {
    const row = lines(
      bookingsToCsv([{ ...booking, special_request: 'Table for 4, near AC' }]),
    )[1];
    expect(row).toContain('"Table for 4, near AC"');
  });

  it('neutralises a formula smuggled into a special request', () => {
    const row = lines(
      bookingsToCsv([{ ...booking, special_request: '=1+1' }]),
    )[1];
    expect(row).toContain(",'=1+1,");
    expect(row).not.toContain(',=1+1,');
  });

  it('neutralises a formula smuggled into a guest name', () => {
    const row = lines(
      bookingsToCsv([{ ...booking, studentName: '@SUM(1+1)' }]),
    )[1];
    expect(row).toContain(",'@SUM(1+1),");
  });

  it('never writes a phone number, even if one is attached to the row', () => {
    // The type has no phone field; this proves an extra property on the object
    // cannot leak into the file either.
    const withPhone = {
      ...booking,
      phone: '+919876543210',
    } as ExportableBooking;
    const csv = bookingsToCsv([withPhone]);
    expect(csv).not.toContain('9876543210');
    expect(csv.toLowerCase()).not.toContain('phone');
  });

  it('never writes internal identifiers', () => {
    const withIds = {
      ...booking,
      id: 'bk_secret',
      student_id: 'usr_secret',
    } as ExportableBooking;
    const csv = bookingsToCsv([withIds]);
    expect(csv).not.toContain('bk_secret');
    expect(csv).not.toContain('usr_secret');
  });
});
