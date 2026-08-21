// Student-side booking reads (rule 0.1).
import 'server-only';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Tables } from '@/types/db';

export type StudentBooking = Tables<'bookings'> & {
  restaurantName: string;
  offerTitle: string | null;
  eventTitle: string | null;
  alreadyReviewed?: boolean;
};

export async function listStudentBookings(): Promise<StudentBooking[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_id', user.id)
    .order('booking_time', { ascending: false });
  if (!bookings || bookings.length === 0) return [];

  const restaurantIds = [...new Set(bookings.map((b) => b.restaurant_id))];
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds);
  const names = new Map((restaurants ?? []).map((r) => [r.id, r.name]));

  const offerIds = bookings.flatMap((booking) =>
    booking.offer_id ? [booking.offer_id] : [],
  );
  const eventIds = bookings.flatMap((booking) =>
    booking.event_id ? [booking.event_id] : [],
  );
  const [myReviewsResult, offersResult, eventsResult] = await Promise.all([
    supabase.from('reviews').select('booking_id').eq('student_id', user.id),
    offerIds.length
      ? supabase
          .from('offers')
          .select('id, title, discount_text')
          .in('id', offerIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from('events').select('id, title').in('id', eventIds)
      : Promise.resolve({ data: [] }),
  ]);
  const myReviews = myReviewsResult.data;
  const reviewed = new Set((myReviews ?? []).map((r) => r.booking_id));
  const offerNames = new Map(
    (offersResult.data ?? []).map((offer) => [
      offer.id,
      offer.discount_text || offer.title,
    ]),
  );
  const eventNames = new Map(
    (eventsResult.data ?? []).map((event) => [event.id, event.title]),
  );

  return bookings.map((b) => ({
    ...b,
    restaurantName: names.get(b.restaurant_id) ?? 'A restaurant',
    offerTitle: b.offer_id ? (offerNames.get(b.offer_id) ?? null) : null,
    eventTitle: b.event_id ? (eventNames.get(b.event_id) ?? null) : null,
    alreadyReviewed: reviewed.has(b.id),
  }));
}

export async function getStudentBooking(
  id: string,
): Promise<StudentBooking | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: b } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!b) return null;
  const { data: r } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', b.restaurant_id)
    .maybeSingle();
  const [offerResult, eventResult] = await Promise.all([
    b.offer_id
      ? supabase
          .from('offers')
          .select('title, discount_text')
          .eq('id', b.offer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    b.event_id
      ? supabase
          .from('events')
          .select('title')
          .eq('id', b.event_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    ...b,
    restaurantName: r?.name ?? 'A restaurant',
    offerTitle: offerResult.data
      ? offerResult.data.discount_text || offerResult.data.title
      : null,
    eventTitle: eventResult.data?.title ?? null,
  };
}
