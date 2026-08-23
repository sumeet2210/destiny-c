// Student-side booking reads, ported from lib/queries/bookings.ts. The client is
// always the caller's user-scoped supabase client, so RLS returns only their own
// bookings — no student_id guard needed beyond what the joins use for labels.

export async function listStudentBookings(db, me) {
  const { data: bookings } = await db
    .from('bookings')
    .select('*')
    .eq('student_id', me.id)
    .order('booking_time', { ascending: false });
  if (!bookings || bookings.length === 0) return [];

  const restaurantIds = [...new Set(bookings.map((b) => b.restaurant_id))];
  const { data: restaurants } = await db
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds);
  const names = new Map((restaurants ?? []).map((r) => [r.id, r.name]));

  const offerIds = bookings.flatMap((b) => (b.offer_id ? [b.offer_id] : []));
  const eventIds = bookings.flatMap((b) => (b.event_id ? [b.event_id] : []));
  const [myReviewsResult, offersResult, eventsResult] = await Promise.all([
    db.from('reviews').select('booking_id').eq('student_id', me.id),
    offerIds.length
      ? db.from('offers').select('id, title, discount_text').in('id', offerIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? db.from('events').select('id, title').in('id', eventIds)
      : Promise.resolve({ data: [] }),
  ]);
  const reviewed = new Set((myReviewsResult.data ?? []).map((r) => r.booking_id));
  const offerNames = new Map(
    (offersResult.data ?? []).map((o) => [o.id, o.discount_text || o.title]),
  );
  const eventNames = new Map(
    (eventsResult.data ?? []).map((e) => [e.id, e.title]),
  );

  return bookings.map((b) => ({
    ...b,
    restaurantName: names.get(b.restaurant_id) ?? 'A restaurant',
    offerTitle: b.offer_id ? (offerNames.get(b.offer_id) ?? null) : null,
    eventTitle: b.event_id ? (eventNames.get(b.event_id) ?? null) : null,
    alreadyReviewed: reviewed.has(b.id),
  }));
}

export async function getStudentBooking(db, id) {
  const { data: b } = await db
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!b) return null;
  const { data: r } = await db
    .from('restaurants')
    .select('name')
    .eq('id', b.restaurant_id)
    .maybeSingle();
  const [offerResult, eventResult] = await Promise.all([
    b.offer_id
      ? db
          .from('offers')
          .select('title, discount_text')
          .eq('id', b.offer_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    b.event_id
      ? db.from('events').select('title').eq('id', b.event_id).maybeSingle()
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
