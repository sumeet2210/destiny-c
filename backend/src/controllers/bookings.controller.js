// Booking create + mutations. The server-side window check here is the source of
// truth (booking-flow rule 1) — the form's check is only fast feedback. All DB
// calls run under the caller's user-scoped client (req.db), so RLS + the
// booking_update_rules trigger enforce who may change what.
import { validateBookingWindow } from '../lib/domain/booking.js';
import { listStudentBookings, getStudentBooking } from '../lib/view/bookings.js';
import { HttpError } from '../middleware/error.js';

export async function create(req, res) {
  const {
    restaurantId,
    bookingTime,
    bookingEndTime,
    headcount,
    specialRequest,
    offerId,
    eventId,
  } = req.body ?? {};

  if (
    !restaurantId ||
    !bookingTime ||
    !bookingEndTime ||
    !headcount ||
    headcount < 1 ||
    headcount > 15
  ) {
    throw new HttpError(400, 'Missing booking details.');
  }
  if (offerId && eventId) {
    throw new HttpError(400, 'Choose either one offer or one event.');
  }

  const check = validateBookingWindow(
    new Date(bookingTime),
    new Date(bookingEndTime),
  );
  if (!check.ok) throw new HttpError(422, check.reason);

  const db = req.db;
  const [offerResult, eventResult] = await Promise.all([
    offerId
      ? db
          .from('offers')
          .select('id')
          .eq('id', offerId)
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    eventId
      ? db
          .from('events')
          .select('id')
          .eq('id', eventId)
          .eq('restaurant_id', restaurantId)
          .eq('is_cancelled', false)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if ((offerId && !offerResult.data) || (eventId && !eventResult.data)) {
    throw new HttpError(422, 'That offer or event is no longer available.');
  }

  const { data, error } = await db
    .from('bookings')
    .insert({
      student_id: req.authUser.id,
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
  if (error) throw new HttpError(500, error.message);
  res.json({ ok: true, id: data.id });
}

export async function listMine(req, res) {
  res.json({ ok: true, bookings: await listStudentBookings(req.db, req.user) });
}

export async function getOne(req, res) {
  const booking = await getStudentBooking(req.db, req.params.id);
  if (!booking) throw new HttpError(404, 'Booking not found.');
  res.json({ ok: true, booking });
}

/** Student confirms from the reminder: sets confirmed_at, status stays 'confirmed'. */
export async function confirm(req, res) {
  const { error } = await req.db
    .from('bookings')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function cancel(req, res) {
  const { error } = await req.db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

/** Owner accepts/rejects a pending request. Guarded to status='requested'. */
export async function respond(req, res) {
  const decision = req.body?.decision;
  if (decision !== 'accept' && decision !== 'reject') {
    throw new HttpError(400, 'Choose accept or reject.');
  }
  const { error } = await req.db
    .from('bookings')
    .update({
      status: decision === 'accept' ? 'confirmed' : 'cancelled',
      owner_decided_at: new Date().toISOString(),
      owner_response: decision === 'accept' ? 'accepted' : 'rejected',
    })
    .eq('id', req.params.id)
    .eq('status', 'requested');
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

/** Owner can add context before or after deciding a reservation. */
export async function note(req, res) {
  const noteText = req.body?.note ?? '';
  const { error } = await req.db
    .from('bookings')
    .update({
      owner_note: noteText.slice(0, 500) || null,
      owner_note_at: new Date().toISOString(),
    })
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}
