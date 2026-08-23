// Owner-side reads, ported from lib/queries/owner.ts. All rows come back under
// the owner's own RLS via the caller's user-scoped client. `me` is the owner's
// users row; me.id === auth uid, so it matches restaurants.owner_id.

export async function getOwnerBundle(db, me) {
  if (!me) return null;
  const { data: restaurant } = await db
    .from('restaurants')
    .select('*')
    .eq('owner_id', me.id)
    .maybeSingle();
  if (!restaurant) return null;

  const [menu, offers, events, photos] = await Promise.all([
    db.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('name'),
    db
      .from('offers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('expires_at', { ascending: false }),
    db
      .from('events')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('starts_at', { ascending: false }),
    db
      .from('restaurant_photos')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order'),
  ]);

  return {
    restaurant,
    menu: menu.data ?? [],
    offers: offers.data ?? [],
    events: events.data ?? [],
    photos: photos.data ?? [],
  };
}

export async function listOwnerBookings(db, me) {
  const bundle = await getOwnerBundle(db, me);
  if (!bundle) return [];
  const { data: bookings } = await db
    .from('bookings')
    .select('*')
    .eq('restaurant_id', bundle.restaurant.id)
    .order('booking_time', { ascending: false });
  if (!bookings || bookings.length === 0) return [];

  const studentIds = [...new Set(bookings.map((b) => b.student_id))];
  const { data: students } = await db
    .from('users')
    .select('id, full_name, no_show_count')
    .in('id', studentIds);
  const byId = new Map((students ?? []).map((s) => [s.id, s]));

  const offerIds = bookings.flatMap((b) => (b.offer_id ? [b.offer_id] : []));
  const eventIds = bookings.flatMap((b) => (b.event_id ? [b.event_id] : []));
  const [offersResult, eventsResult] = await Promise.all([
    offerIds.length
      ? db.from('offers').select('id, title, discount_text').in('id', offerIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? db.from('events').select('id, title').in('id', eventIds)
      : Promise.resolve({ data: [] }),
  ]);
  const offerNames = new Map(
    (offersResult.data ?? []).map((o) => [o.id, o.discount_text || o.title]),
  );
  const eventNames = new Map(
    (eventsResult.data ?? []).map((e) => [e.id, e.title]),
  );

  return bookings.map((b) => ({
    ...b,
    studentName: byId.get(b.student_id)?.full_name ?? null,
    studentNoShows: byId.get(b.student_id)?.no_show_count ?? 0,
    offerTitle: b.offer_id ? (offerNames.get(b.offer_id) ?? null) : null,
    eventTitle: b.event_id ? (eventNames.get(b.event_id) ?? null) : null,
  }));
}

export async function getOwnerAnalytics(db, me) {
  const bundle = await getOwnerBundle(db, me);
  if (!bundle) return null;

  const [byDay, bySource] = await Promise.all([
    db
      .from('restaurant_views_by_day')
      .select('day, views')
      .eq('restaurant_id', bundle.restaurant.id)
      .order('day', { ascending: false })
      .limit(30),
    db
      .from('restaurant_views_by_source')
      .select('source_filter, views')
      .eq('restaurant_id', bundle.restaurant.id)
      .order('views', { ascending: false }),
  ]);

  // View columns are nullable in Postgres views though the base columns aren't —
  // filter defensively, same as the Next query did.
  const days = (byDay.data ?? []).flatMap((d) =>
    d.day === null ? [] : [{ day: d.day, views: Number(d.views) }],
  );
  const cutoff7 = Date.now() - 7 * 86_400_000;
  return {
    totals: {
      last7: days
        .filter((d) => new Date(d.day).getTime() >= cutoff7)
        .reduce((a, d) => a + d.views, 0),
      last30: days.reduce((a, d) => a + d.views, 0),
    },
    byDay: days,
    bySource: (bySource.data ?? []).flatMap((s) =>
      s.source_filter === null
        ? []
        : [{ source_filter: s.source_filter, views: Number(s.views) }],
    ),
  };
}
