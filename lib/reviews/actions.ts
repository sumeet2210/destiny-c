'use server';

// P8-1: write a review, gated to completed bookings owned by the requester.
// RLS enforces the gate; this re-checks for a friendly error.

import { revalidatePath } from 'next/cache';
import { canReview, type BookingLike } from '@/lib/domain/booking';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ActionResult = { ok: boolean; message?: string };

export async function createReview(input: {
  bookingId: string;
  rating: number;
  comment: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Reviews need a live Supabase project.' };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, message: 'Pick a rating.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Log in first.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id, restaurant_id, student_id, status, booking_time, reminder_sent_at, confirmed_at',
    )
    .eq('id', input.bookingId)
    .maybeSingle();
  if (!booking || booking.student_id !== user.id) {
    return { ok: false, message: 'That booking is not yours to review.' };
  }
  if (!canReview(booking as BookingLike)) {
    return {
      ok: false,
      message: 'Reviews unlock once the visit is over.',
    };
  }

  const { error } = await supabase.from('reviews').insert({
    booking_id: booking.id,
    student_id: user.id,
    restaurant_id: booking.restaurant_id,
    rating: Math.round(input.rating),
    comment: input.comment.slice(0, 1000) || null,
  });
  if (error) {
    if (error.code === '23505') {
      return { ok: false, message: 'You already reviewed this visit.' };
    }
    return { ok: false, message: error.message };
  }
  revalidatePath('/bookings');
  revalidatePath('/reviews');
  revalidatePath('/owner/analytics');
  revalidatePath(`/restaurant/${booking.restaurant_id}`);
  return { ok: true };
}
