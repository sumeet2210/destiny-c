// CSV export of an owner's own reservations.
//
// Two hazards are handled here rather than at the route, so they are covered by
// unit tests instead of trust:
//
// 1. RFC 4180 escaping — a guest note containing a comma, a quote or a newline
//    must not shift every following column.
// 2. Spreadsheet formula injection — a cell beginning =, +, -, @, tab or CR is
//    executed as a formula by Excel and Sheets. A guest could put
//    =HYPERLINK(...) in a special request, so every value is neutralised with a
//    leading apostrophe before quoting.
//
// Status is exported raw ('requested', 'confirmed', …) rather than as the
// owner-facing wording. An export is data, and the raw value is stable,
// unambiguous, and sortable in a spreadsheet.
//
// Phone numbers are absent by construction: ExportableBooking has no phone
// field, so one cannot be added to the file by accident. Main never shows an
// owner a diner's number and exporting is not a reason to start.

/** Exactly the fields that reach the file — deliberately no contact details. */
export type ExportableBooking = {
  booking_time: string;
  studentName: string | null;
  headcount: number;
  status: string;
  special_request: string | null;
  offerTitle: string | null;
  eventTitle: string | null;
  owner_note: string | null;
  confirmed_at: string | null;
};

export const BOOKING_EXPORT_HEADERS = [
  'Booking time (IST)',
  'Guest',
  'Party size',
  'Status',
  'Special request',
  'Offer',
  'Event',
  'Your note',
  'Confirmed at (IST)',
] as const;

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * One CSV field: formula-neutralised, then quoted if the content needs it.
 *
 * Embedded newlines are kept rather than stripped — quoted, they are valid
 * CSV and the owner's note survives intact.
 */
export function escapeCsvValue(value: string): string {
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return /["\n\r,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * A timestamp in IST as `YYYY-MM-DD HH:mm`, sortable as text.
 *
 * Asia/Kolkata matches how every booking time is already rendered to the owner
 * on screen, so the file and the page never disagree about when a table is
 * booked. Built from parts so the output does not drift with the host locale.
 */
export function formatIstTimestamp(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`;
}

/** The file body for the given bookings, in the order supplied. */
export function bookingsToCsv(bookings: readonly ExportableBooking[]): string {
  const rows = bookings.map((booking) => [
    formatIstTimestamp(booking.booking_time),
    booking.studentName ?? '',
    String(booking.headcount),
    booking.status,
    booking.special_request ?? '',
    booking.offerTitle ?? '',
    booking.eventTitle ?? '',
    booking.owner_note ?? '',
    formatIstTimestamp(booking.confirmed_at),
  ]);

  return [BOOKING_EXPORT_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n');
}
