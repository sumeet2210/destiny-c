// P8-1: write a review, gated to completed + confirmed bookings owned by the
// requester. RLS enforces the gate; this re-checks canReview for a friendly
// error. Runs under the caller's user-scoped client.
import { canReview } from '../lib/domain/booking.js';
import { HttpError } from '../middleware/error.js';

export async function create(req, res) {
  const { bookingId, rating, comment } = req.body ?? {};
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Pick a rating.');

  const db = req.db;
  const { data: booking } = await db
    .from('bookings')
    .select(
      'id, restaurant_id, student_id, status, booking_time, reminder_sent_at, confirmed_at',
    )
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || booking.student_id !== req.authUser.id) {
    throw new HttpError(403, 'That booking is not yours to review.');
  }
  if (!canReview(booking)) {
    throw new HttpError(
      422,
      'Reviews unlock once the visit is over and you confirmed you went — that is what keeps them trustworthy.',
    );
  }

  const { error } = await db.from('reviews').insert({
    booking_id: booking.id,
    student_id: req.authUser.id,
    restaurant_id: booking.restaurant_id,
    rating: Math.round(rating),
    comment: comment?.slice(0, 1000) || null,
  });
  if (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'You already reviewed this visit.');
    }
    throw new HttpError(400, error.message);
  }
  res.json({ ok: true });
}
