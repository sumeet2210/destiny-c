import { describe, expect, it } from 'vitest';
import {
  filterOwnerBookings,
  normalizeGuestQuery,
  parseStatusFilter,
  type FilterableBooking,
} from './booking-filters';

describe('parseStatusFilter', () => {
  it('accepts the three real buckets', () => {
    expect(parseStatusFilter('requested')).toBe('requested');
    expect(parseStatusFilter('confirmed')).toBe('confirmed');
    expect(parseStatusFilter('cancelled')).toBe('cancelled');
  });

  it('passes "all" through', () => {
    expect(parseStatusFilter('all')).toBe('all');
  });

  it('falls back to "all" for a missing param', () => {
    expect(parseStatusFilter(undefined)).toBe('all');
    expect(parseStatusFilter(null)).toBe('all');
    expect(parseStatusFilter('')).toBe('all');
  });

  it('falls back to "all" for a hand-typed or hostile value', () => {
    expect(parseStatusFilter('bogus')).toBe('all');
    expect(parseStatusFilter("'; drop table bookings; --")).toBe('all');
  });

  it('is case-sensitive, so odd casing degrades to "all" not to an error', () => {
    expect(parseStatusFilter('Confirmed')).toBe('all');
  });

  it('does not expose statuses the owner cannot filter by', () => {
    // These are real booking statuses but not offered as buckets; they must
    // not become filterable through the URL.
    expect(parseStatusFilter('unconfirmed')).toBe('all');
    expect(parseStatusFilter('completed')).toBe('all');
  });

  it('collapses a repeated param to its first value', () => {
    // URLSearchParams.get() in the filter bar returns the first value, so the
    // page must agree or the highlighted chip would contradict the rows.
    expect(parseStatusFilter(['requested', 'confirmed'])).toBe('requested');
    expect(parseStatusFilter(['bogus', 'confirmed'])).toBe('all');
    expect(parseStatusFilter([])).toBe('all');
  });
});

describe('normalizeGuestQuery', () => {
  it('trims and case-folds', () => {
    expect(normalizeGuestQuery('  Aarav  ')).toBe('aarav');
  });

  it('treats absent and whitespace-only input as no search', () => {
    expect(normalizeGuestQuery(undefined)).toBe('');
    expect(normalizeGuestQuery(null)).toBe('');
    expect(normalizeGuestQuery('   ')).toBe('');
  });

  it('collapses a repeated param to its first value', () => {
    expect(normalizeGuestQuery(['Priya', 'Rohit'])).toBe('priya');
    expect(normalizeGuestQuery([])).toBe('');
  });
});

const bookings: FilterableBooking[] = [
  { status: 'requested', studentName: 'Aarav Sharma' },
  { status: 'confirmed', studentName: 'Priya Nair' },
  { status: 'cancelled', studentName: 'Rohit Verma' },
  { status: 'unconfirmed', studentName: 'Aarav Menon' },
  { status: 'completed', studentName: null },
];

const names = (rows: FilterableBooking[]) => rows.map((r) => r.studentName);

describe('filterOwnerBookings', () => {
  it('returns everything when nothing is filtered', () => {
    expect(filterOwnerBookings(bookings, {})).toHaveLength(5);
  });

  it('keeps statuses outside the four buckets reachable under "all"', () => {
    const all = filterOwnerBookings(bookings, { status: 'all' });
    expect(all.map((r) => r.status)).toContain('unconfirmed');
    expect(all.map((r) => r.status)).toContain('completed');
  });

  it('filters to requested only', () => {
    expect(
      names(filterOwnerBookings(bookings, { status: 'requested' })),
    ).toEqual(['Aarav Sharma']);
  });

  it('filters to confirmed only', () => {
    expect(
      names(filterOwnerBookings(bookings, { status: 'confirmed' })),
    ).toEqual(['Priya Nair']);
  });

  it('filters to cancelled only', () => {
    expect(
      names(filterOwnerBookings(bookings, { status: 'cancelled' })),
    ).toEqual(['Rohit Verma']);
  });

  it('ignores an invalid status rather than returning nothing', () => {
    expect(filterOwnerBookings(bookings, { status: 'nonsense' })).toHaveLength(
      5,
    );
  });

  it('searches guest names case-insensitively', () => {
    expect(names(filterOwnerBookings(bookings, { guest: 'PRIYA' }))).toEqual([
      'Priya Nair',
    ]);
  });

  it('matches on a substring, including surnames', () => {
    expect(names(filterOwnerBookings(bookings, { guest: 'verma' }))).toEqual([
      'Rohit Verma',
    ]);
  });

  it('tolerates padded search terms', () => {
    expect(names(filterOwnerBookings(bookings, { guest: '  nair ' }))).toEqual([
      'Priya Nair',
    ]);
  });

  it('can match several guests', () => {
    expect(names(filterOwnerBookings(bookings, { guest: 'aarav' }))).toEqual([
      'Aarav Sharma',
      'Aarav Menon',
    ]);
  });

  it('never matches a booking with no name against a search', () => {
    const found = filterOwnerBookings(bookings, { guest: 'a' });
    expect(found.every((r) => r.studentName !== null)).toBe(true);
  });

  it('still includes nameless bookings when there is no search', () => {
    expect(names(filterOwnerBookings(bookings, { status: 'all' }))).toContain(
      null,
    );
  });

  it('applies status and search together', () => {
    // 'aarav' alone matches two rows; the status narrows it to one.
    expect(
      names(
        filterOwnerBookings(bookings, { status: 'requested', guest: 'aarav' }),
      ),
    ).toEqual(['Aarav Sharma']);
  });

  it('returns an empty list when the combination matches nothing', () => {
    expect(
      filterOwnerBookings(bookings, { status: 'confirmed', guest: 'aarav' }),
    ).toEqual([]);
    expect(filterOwnerBookings(bookings, { guest: 'zzzz' })).toEqual([]);
  });

  it('treats a blank search as no search at all', () => {
    expect(filterOwnerBookings(bookings, { guest: '   ' })).toHaveLength(5);
    expect(filterOwnerBookings(bookings, { guest: '' })).toHaveLength(5);
  });

  it('preserves the incoming order', () => {
    const found = filterOwnerBookings(bookings, { guest: 'aarav' });
    expect(found[0]?.studentName).toBe('Aarav Sharma');
    expect(found[1]?.studentName).toBe('Aarav Menon');
  });

  it('does not mutate the input list', () => {
    const input = [...bookings];
    filterOwnerBookings(input, { status: 'requested', guest: 'aarav' });
    expect(input).toEqual(bookings);
  });

  it('treats a search term as text, never as a pattern', () => {
    // A regex-flavoured term must match literally and find nothing here.
    expect(filterOwnerBookings(bookings, { guest: '.*' })).toEqual([]);
  });

  it('filters on the first value of a repeated param', () => {
    expect(
      names(filterOwnerBookings(bookings, { status: ['requested', 'all'] })),
    ).toEqual(['Aarav Sharma']);
  });
});
