import { describe, expect, it } from 'vitest';
import {
  filterOwnerBookings,
  normalizeGuestQuery,
  parseStatusFilter,
  type FilterableBooking,
} from './booking-filters';

describe('parseStatusFilter', () => {
  it('accepts cancelled', () => {
    expect(parseStatusFilter('cancelled')).toBe('cancelled');
  });

  it('uses coming as the default and for stale values', () => {
    expect(parseStatusFilter(undefined)).toBe('coming');
    expect(parseStatusFilter('')).toBe('coming');
    expect(parseStatusFilter('requested')).toBe('coming');
    expect(parseStatusFilter('confirmed')).toBe('coming');
    expect(parseStatusFilter('bogus')).toBe('coming');
  });

  it('uses the first repeated parameter', () => {
    expect(parseStatusFilter(['cancelled', 'coming'])).toBe('cancelled');
    expect(parseStatusFilter([])).toBe('coming');
  });
});

describe('normalizeGuestQuery', () => {
  it('trims and case-folds', () => {
    expect(normalizeGuestQuery('  Aarav  ')).toBe('aarav');
  });

  it('treats an absent or blank value as no search', () => {
    expect(normalizeGuestQuery(undefined)).toBe('');
    expect(normalizeGuestQuery('   ')).toBe('');
  });
});

const bookings: FilterableBooking[] = [
  { status: 'requested', studentName: 'Aarav Sharma' },
  { status: 'confirmed', studentName: 'Priya Nair' },
  { status: 'cancelled', studentName: 'Rohit Verma' },
  { status: 'unconfirmed', studentName: 'Aarav Menon' },
  { status: 'completed', studentName: null },
];

describe('filterOwnerBookings', () => {
  it('groups active booking states under coming', () => {
    expect(filterOwnerBookings(bookings, {}).map((row) => row.status)).toEqual([
      'requested',
      'confirmed',
      'unconfirmed',
    ]);
  });

  it('shows only cancelled bookings in cancelled', () => {
    expect(
      filterOwnerBookings(bookings, { status: 'cancelled' }).map(
        (row) => row.studentName,
      ),
    ).toEqual(['Rohit Verma']);
  });

  it('does not include completed bookings in either current bucket', () => {
    expect(
      filterOwnerBookings(bookings, {}).some(
        (row) => row.status === 'completed',
      ),
    ).toBe(false);
    expect(
      filterOwnerBookings(bookings, { status: 'cancelled' }).some(
        (row) => row.status === 'completed',
      ),
    ).toBe(false);
  });

  it('combines status and case-insensitive guest search', () => {
    expect(
      filterOwnerBookings(bookings, { guest: 'AARAV' }).map(
        (row) => row.studentName,
      ),
    ).toEqual(['Aarav Sharma', 'Aarav Menon']);
    expect(
      filterOwnerBookings(bookings, {
        status: 'cancelled',
        guest: 'aarav',
      }),
    ).toEqual([]);
  });

  it('preserves the input and treats search text literally', () => {
    const input = [...bookings];
    expect(filterOwnerBookings(input, { guest: '.*' })).toEqual([]);
    expect(input).toEqual(bookings);
  });
});
