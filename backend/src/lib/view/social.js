// Social reads, ported from lib/queries/social.ts. Every query runs under the
// caller's user-scoped client, so RLS does the consent filtering (friend +
// sharing on) — these functions just ask. `me` is the caller's users row.

export async function getFriendsBundle(db, me) {
  const empty = { friends: [], incoming: [], outgoing: [] };
  if (!me || me.role !== 'student') return empty;

  const { data: rows } = await db.from('friendships').select('*');
  if (!rows || rows.length === 0) return empty;

  const otherIds = [
    ...new Set(
      rows.map((f) =>
        f.requester_id === me.id ? f.addressee_id : f.requester_id,
      ),
    ),
  ];
  const { data: people } = await db
    .from('users')
    .select('id, full_name, hostel')
    .in('id', otherIds);
  const byId = new Map((people ?? []).map((p) => [p.id, p]));

  const entry = (f) => {
    const otherId = f.requester_id === me.id ? f.addressee_id : f.requester_id;
    return {
      friendshipId: f.id,
      userId: otherId,
      name: byId.get(otherId)?.full_name ?? null,
      hostel: byId.get(otherId)?.hostel ?? null,
    };
  };

  return {
    friends: rows.filter((f) => f.status === 'accepted').map(entry),
    incoming: rows
      .filter((f) => f.status === 'pending' && f.addressee_id === me.id)
      .map(entry),
    outgoing: rows
      .filter((f) => f.status === 'pending' && f.requester_id === me.id)
      .map(entry),
  };
}

/** Restaurant ids the current student has saved. */
export async function getSavedIds(db, me) {
  if (!me || me.role !== 'student') return new Set();
  const { data } = await db
    .from('saved_restaurants')
    .select('restaurant_id')
    .eq('student_id', me.id);
  return new Set((data ?? []).map((r) => r.restaurant_id));
}

/**
 * P9-5 / P9-6: what accepted, sharing-on friends have saved and RSVP'd.
 * RLS does the consent filtering — this just asks. Returns Maps; controllers
 * convert to plain objects for JSON.
 */
export async function getFriendActivity(db, me) {
  const empty = { savedBy: new Map(), goingTo: new Map() };
  if (!me || me.role !== 'student') return empty;
  const { friends } = await getFriendsBundle(db, me);
  if (friends.length === 0) return empty;

  const friendIds = friends.map((f) => f.userId);
  const nameOf = new Map(friends.map((f) => [f.userId, f.name ?? 'A friend']));

  const [saved, rsvps] = await Promise.all([
    db
      .from('saved_restaurants')
      .select('restaurant_id, student_id')
      .in('student_id', friendIds),
    db
      .from('event_rsvps')
      .select('event_id, student_id')
      .in('student_id', friendIds),
  ]);

  const savedBy = new Map();
  for (const row of saved.data ?? []) {
    const list = savedBy.get(row.restaurant_id) ?? [];
    list.push(nameOf.get(row.student_id) ?? 'A friend');
    savedBy.set(row.restaurant_id, list);
  }
  const goingTo = new Map();
  for (const row of rsvps.data ?? []) {
    const list = goingTo.get(row.event_id) ?? [];
    list.push(nameOf.get(row.student_id) ?? 'A friend');
    goingTo.set(row.event_id, list);
  }
  return { savedBy, goingTo };
}

/** Event ids the current student has RSVP'd to. */
export async function getMyRsvpIds(db, me) {
  if (!me || me.role !== 'student') return new Set();
  const { data } = await db
    .from('event_rsvps')
    .select('event_id')
    .eq('student_id', me.id);
  return new Set((data ?? []).map((r) => r.event_id));
}
