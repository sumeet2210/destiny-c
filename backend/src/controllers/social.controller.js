// Phase 9: saved, friends, RSVPs. Friendships go through the DB's canonical-pair
// constraints; RLS enforces the two-key consent rule. All run under the caller's
// user-scoped client (req.db) as a student (requireStudent upstream). Read
// helpers return Sets/Maps; they're converted to arrays/objects for JSON here.
import { SOCIAL } from '../config/social.js';
import {
  getFriendsBundle,
  getSavedIds,
  getFriendActivity,
  getMyRsvpIds,
} from '../lib/view/social.js';
import { HttpError } from '../middleware/error.js';

// --- Saved (P9-1) -----------------------------------------------------------

export async function savedList(req, res) {
  const ids = await getSavedIds(req.db, req.user);
  res.json({ ok: true, savedIds: [...ids] });
}

export async function toggleSave(req, res) {
  const uid = req.user.id;
  const restaurantId = req.params.id;
  const { data: existing } = await req.db
    .from('saved_restaurants')
    .select('id')
    .eq('student_id', uid)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (existing) {
    const { error } = await req.db
      .from('saved_restaurants')
      .delete()
      .eq('id', existing.id);
    if (error) throw new HttpError(400, error.message);
    return res.json({ ok: true, saved: false });
  }
  const { error } = await req.db
    .from('saved_restaurants')
    .insert({ student_id: uid, restaurant_id: restaurantId });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true, saved: true });
}

// --- Friends (P9-2) ---------------------------------------------------------

export async function friends(req, res) {
  res.json({ ok: true, ...(await getFriendsBundle(req.db, req.user)) });
}

export async function addFriend(req, res) {
  const uid = req.user.id;
  const email = (req.body?.email ?? '').trim();
  const { data: matches, error: findError } = await req.db.rpc(
    'find_student_by_email',
    { lookup_email: email },
  );
  if (findError) throw new HttpError(400, findError.message);
  const target = matches?.[0];
  if (!target) {
    throw new HttpError(
      404,
      'No student with that email yet — they need to log in once first.',
    );
  }

  const { count } = await req.db
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
  if ((count ?? 0) >= SOCIAL.maxFriends) {
    throw new HttpError(400, 'Friend list is full.');
  }

  const { error } = await req.db
    .from('friendships')
    .insert({ requester_id: uid, addressee_id: target.id });
  if (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'A request between you two already exists.');
    }
    throw new HttpError(400, error.message);
  }
  res.json({ ok: true });
}

export async function respondFriend(req, res) {
  const accept = req.body?.accept === true;
  const id = req.params.id;
  const { error } = accept
    ? await req.db
        .from('friendships')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', id)
    : await req.db.from('friendships').delete().eq('id', id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function removeFriend(req, res) {
  const { error } = await req.db
    .from('friendships')
    .delete()
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Event RSVPs (P9-4) -----------------------------------------------------

export async function rsvps(req, res) {
  const ids = await getMyRsvpIds(req.db, req.user);
  res.json({ ok: true, rsvpIds: [...ids] });
}

export async function toggleRsvp(req, res) {
  const uid = req.user.id;
  const eventId = req.params.id;
  const { data: existing } = await req.db
    .from('event_rsvps')
    .select('id')
    .eq('student_id', uid)
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    const { error } = await req.db
      .from('event_rsvps')
      .delete()
      .eq('id', existing.id);
    if (error) throw new HttpError(400, error.message);
    return res.json({ ok: true, going: false });
  }
  const { error } = await req.db
    .from('event_rsvps')
    .insert({ student_id: uid, event_id: eventId });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true, going: true });
}

// --- Friend activity (P9-5 / P9-6) ------------------------------------------

export async function friendActivity(req, res) {
  const { savedBy, goingTo } = await getFriendActivity(req.db, req.user);
  res.json({
    ok: true,
    savedBy: Object.fromEntries(savedBy),
    goingTo: Object.fromEntries(goingTo),
  });
}
