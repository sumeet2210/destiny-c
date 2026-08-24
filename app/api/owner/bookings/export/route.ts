// CSV download of the reservations the owner is already looking at.
//
// A route handler rather than a server action because the response needs
// text/csv and Content-Disposition headers. Route handlers do not inherit the
// (manage) layout, so the owner check that layout performs via requireOwner()
// is repeated here explicitly — with status codes rather than redirects, since
// a download cannot usefully follow one.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { bookingsToCsv, formatIstTimestamp } from '@/lib/domain/booking-export';
import { filterOwnerBookings } from '@/lib/domain/booking-filters';
import { nowMs } from '@/lib/now';
import { listOwnerBookings } from '@/lib/queries/owner';
import { isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * UTF-8 byte order mark, U+FEFF.
 *
 * Excel reads a BOM-less CSV as the local ANSI codepage and mangles any name
 * with a non-ASCII character in it. Built with fromCharCode rather than written
 * literally so the character is visible in the source.
 */
const UTF8_BOM = String.fromCharCode(0xfeff);

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Exports need a live Supabase project (seed mode).' },
      { status: 503 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Log in first.' },
      { status: 401 },
    );
  }
  if (user.role !== 'owner') {
    return NextResponse.json(
      { ok: false, error: 'Only owners can export reservations.' },
      { status: 403 },
    );
  }

  // listOwnerBookings resolves the restaurant from the caller's own session, so
  // there is no restaurant id in the URL to tamper with — an owner can only
  // ever export their own rows, with RLS as the backstop. The same filters the
  // page applies are applied here so the file matches what is on screen.
  const params = new URL(request.url).searchParams;
  const bookings = filterOwnerBookings(await listOwnerBookings(), {
    status: params.get('status'),
    guest: params.get('guest'),
  });

  const day = formatIstTimestamp(new Date(nowMs()).toISOString()).slice(0, 10);
  return new NextResponse(`${UTF8_BOM}${bookingsToCsv(bookings)}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="destiny-reservations-${day}.csv"`,
      // Guest names in a shared cache would be a privacy leak, not a speedup.
      'Cache-Control': 'private, no-store',
    },
  });
}
