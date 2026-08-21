// P6-3: booking creation. The server-side lead-time check here is the source
// of truth — the form's check is only fast feedback (booking-flow rule 1).
import { NextResponse } from 'next/server';
import { validateBookingWindow } from '@/lib/domain/booking';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Bookings need a live Supabase project (seed mode).',
      },
      { status: 503 },
    );
  }

  let body: {
    restaurantId?: string;
    bookingTime?: string;
    bookingEndTime?: string;
    headcount?: number;
    specialRequest?: string;
    offerId?: string | null;
    eventId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Bad request.' },
      { status: 400 },
    );
  }

  const {
    restaurantId,
    bookingTime,
    bookingEndTime,
    headcount,
    specialRequest,
    offerId,
    eventId,
  } = body;
  if (
    !restaurantId ||
    !bookingTime ||
    !bookingEndTime ||
    !headcount ||
    headcount < 1 ||
    headcount > 15
  ) {
    return NextResponse.json(
      { ok: false, error: 'Missing booking details.' },
      { status: 400 },
    );
  }

  if (offerId && eventId) {
    return NextResponse.json(
      { ok: false, error: 'Choose either one offer or one event.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Log in first.' },
      { status: 401 },
    );
  }
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'student') {
    return NextResponse.json(
      { ok: false, error: 'Only students can send booking notices.' },
      { status: 403 },
    );
  }

  const check = validateBookingWindow(
    new Date(bookingTime),
    new Date(bookingEndTime),
  );
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, error: check.reason },
      { status: 422 },
    );
  }

  const [offerResult, eventResult] = await Promise.all([
    offerId
      ? supabase
          .from('offers')
          .select('id')
          .eq('id', offerId)
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    eventId
      ? supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .eq('restaurant_id', restaurantId)
          .eq('is_cancelled', false)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if ((offerId && !offerResult.data) || (eventId && !eventResult.data)) {
    return NextResponse.json(
      { ok: false, error: 'That offer or event is no longer available.' },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      student_id: user.id,
      restaurant_id: restaurantId,
      booking_time: new Date(bookingTime).toISOString(),
      booking_end_time: new Date(bookingEndTime).toISOString(),
      headcount: Math.floor(headcount),
      special_request: specialRequest?.slice(0, 500) || null,
      offer_id: offerId || null,
      event_id: eventId || null,
      status: 'requested',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: data.id });
}
