// Filtering for the owner's booking list.
//
// Pure on purpose. The page filters on the server (the client never receives
// rows it is not allowed to see) but the chip highlighting has to agree with
// what the server actually did, so both sides call the same parser. An unknown
// ?status= value therefore falls back to "all" in the UI and in the query
// alike, instead of silently disagreeing.
//
// Filtering happens in memory rather than in Postgres because studentName is
// stitched in from a second users query in listOwnerBookings — there is no
// single row to match a name against in SQL. At pilot scale an owner has tens
// of bookings, so this is the same deliberate trade-off the public catalog
// makes (see lib/queries/catalog.ts).
import type { BookingStatus } from './booking';

/** The status buckets an owner can filter by, plus the unfiltered default. */
export type BookingStatusFilter =
  'all' | 'requested' | 'confirmed' | 'cancelled';

/**
 * A raw search param: absent, a single value, or repeated (?k=a&k=b).
 *
 * Repeated params collapse to the first value, which is what
 * URLSearchParams.get() gives the filter bar — so the highlighted chip always
 * describes the rows the page actually rendered.
 */
export type RawParam = string | string[] | null | undefined;

const firstValue = (raw: RawParam): string | undefined =>
  Array.isArray(raw) ? raw[0] : (raw ?? undefined);

/**
 * Reads a ?status= value, falling back to "all" for anything unrecognised.
 *
 * Deliberately total: a hand-typed or stale URL must never reach the database
 * as an invalid enum, and must never blank the list either.
 */
export function parseStatusFilter(raw: RawParam): BookingStatusFilter {
  const value = firstValue(raw);
  switch (value) {
    case 'requested':
    case 'confirmed':
    case 'cancelled':
      return value;
    default:
      return 'all';
  }
}

/** Trims and case-folds a guest search term; blank means "no search". */
export function normalizeGuestQuery(raw: RawParam): string {
  return (firstValue(raw) ?? '').trim().toLowerCase();
}

/** The only fields filtering looks at, so tests need no full booking row. */
export type FilterableBooking = {
  status: BookingStatus;
  studentName: string | null;
};

/**
 * Applies the status bucket and the guest-name search, in original order.
 *
 * Plain substring matching, not a regex, so a search term can never be a
 * pattern. Statuses outside the four buckets (unconfirmed, completed) stay
 * reachable under "all".
 */
export function filterOwnerBookings<T extends FilterableBooking>(
  bookings: readonly T[],
  filters: { status?: RawParam; guest?: RawParam },
): T[] {
  const status = parseStatusFilter(filters.status);
  const guest = normalizeGuestQuery(filters.guest);

  return bookings.filter((booking) => {
    if (status !== 'all' && booking.status !== status) return false;
    if (guest === '') return true;
    // A booking with no name on file cannot match a name search.
    return (booking.studentName ?? '').toLowerCase().includes(guest);
  });
}
