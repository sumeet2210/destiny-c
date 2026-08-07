// P6-3: booking creation. The server-side lead-time check here is the source
// of truth — the form's check is only fast feedback (booking-flow rule 1).
import { NextResponse } from 'next/server';
import { validateLeadTime } from '@/lib/domain/booking';
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
    headcount?: number;
    specialRequest?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Bad request.' },
      { status: 400 },
    );
  }

  const { restaurantId, bookingTime, headcount, specialRequest } = body;
  if (!restaurantId || !bookingTime || !headcount || headcount < 1) {
    return NextResponse.json(
      { ok: false, error: 'Missing booking details.' },
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

  const check = validateLeadTime(new Date(bookingTime));
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, error: check.reason },
      { status: 422 },
    );
  }

  // requested → validated → confirmed by the system: "accepted into the
  // queue", never "table held" (architecture.md §4).
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      student_id: user.id,
      restaurant_id: restaurantId,
      booking_time: new Date(bookingTime).toISOString(),
      headcount: Math.floor(headcount),
      special_request: specialRequest?.slice(0, 500) || null,
      status: 'confirmed',
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
