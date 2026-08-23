// Admin console: platform oversight + moderation. There are NO admin RLS
// policies in the schema — that is deliberate (see migrations: owners can't
// self-approve, students can't touch others' rows). Privileged writes such as
// restaurant approval, role changes and moderation therefore run on the
// service-role client (adminClient), which bypasses RLS. The ONLY guard in front
// of that power is the requireUser -> requireAdmin chain on the router, so never
// mount one of these handlers without both. This is the second sanctioned
// service-key consumer after cron.
import { adminClient } from '../lib/supabase.js';
import { HttpError } from '../middleware/error.js';

const RESTAURANT_STATUSES = new Set(['pending_approval', 'active', 'suspended']);
const USER_ROLES = new Set(['student', 'owner', 'admin']);

/** Strip characters that carry meaning in a PostgREST filter before interpolating. */
function safeLike(input) {
  return String(input ?? '')
    .replace(/[,()%*:]/g, '')
    .trim()
    .slice(0, 64);
}

// --- Platform overview ------------------------------------------------------

export async function overview(req, res) {
  const db = adminClient();
  const countOf = async (table, build) => {
    let q = db.from(table).select('id', { count: 'exact', head: true });
    if (build) q = build(q);
    const { count, error } = await q;
    if (error) throw new HttpError(500, error.message);
    return count ?? 0;
  };

  const [
    students,
    owners,
    admins,
    pending,
    active,
    suspended,
    bkRequested,
    bkConfirmed,
    bkCompleted,
    bkCancelled,
    offersLive,
    offersFlagged,
    eventsTotal,
    reviewsTotal,
  ] = await Promise.all([
    countOf('users', (q) => q.eq('role', 'student')),
    countOf('users', (q) => q.eq('role', 'owner')),
    countOf('users', (q) => q.eq('role', 'admin')),
    countOf('restaurants', (q) => q.eq('status', 'pending_approval')),
    countOf('restaurants', (q) => q.eq('status', 'active')),
    countOf('restaurants', (q) => q.eq('status', 'suspended')),
    countOf('bookings', (q) => q.eq('status', 'requested')),
    countOf('bookings', (q) => q.eq('status', 'confirmed')),
    countOf('bookings', (q) => q.eq('status', 'completed')),
    countOf('bookings', (q) => q.eq('status', 'cancelled')),
    countOf('offers', (q) => q.eq('is_active', true)),
    countOf('offers', (q) => q.gt('flagged_count', 0)),
    countOf('events', null),
    countOf('reviews', null),
  ]);

  res.json({
    ok: true,
    overview: {
      users: {
        student: students,
        owner: owners,
        admin: admins,
        total: students + owners + admins,
      },
      restaurants: {
        pending_approval: pending,
        active,
        suspended,
        total: pending + active + suspended,
      },
      bookings: {
        requested: bkRequested,
        confirmed: bkConfirmed,
        completed: bkCompleted,
        cancelled: bkCancelled,
      },
      moderation: {
        offers_live: offersLive,
        offers_flagged: offersFlagged,
        events: eventsTotal,
        reviews: reviewsTotal,
      },
    },
  });
}

// --- Restaurants: approval queue + status control ---------------------------

export async function listRestaurants(req, res) {
  const db = adminClient();
  const status = req.query.status;
  let q = db
    .from('restaurants')
    .select(
      'id, name, area, address, phone, status, owner_id, cover_image_url, created_at',
    )
    .order('created_at', { ascending: false });
  if (status && RESTAURANT_STATUSES.has(status)) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);

  // Decorate with owner name/email (service client, so no join or RLS needed).
  const ownerIds = [...new Set((data ?? []).map((r) => r.owner_id))];
  const owners = new Map();
  if (ownerIds.length) {
    const { data: users } = await db
      .from('users')
      .select('id, full_name, email')
      .in('id', ownerIds);
    for (const u of users ?? []) owners.set(u.id, u);
  }
  const restaurants = (data ?? []).map((r) => ({
    ...r,
    owner: owners.get(r.owner_id) ?? null,
  }));
  res.json({ ok: true, restaurants });
}

export async function setRestaurantStatus(req, res) {
  const status = req.body?.status;
  if (!RESTAURANT_STATUSES.has(status)) {
    throw new HttpError(
      400,
      'Status must be pending_approval, active, or suspended.',
    );
  }
  const db = adminClient();
  const { data, error } = await db
    .from('restaurants')
    .update({ status })
    .eq('id', req.params.id)
    .select('id, status')
    .maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, 'Restaurant not found.');
  res.json({ ok: true, restaurant: data });
}

// --- Users: roles + verification --------------------------------------------

export async function listUsers(req, res) {
  const db = adminClient();
  const role = req.query.role;
  const search = safeLike(req.query.q);
  let query = db
    .from('users')
    .select(
      'id, full_name, email, role, hostel, nitw_verified, no_show_count, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (role && USER_ROLES.has(role)) query = query.eq('role', role);
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw new HttpError(500, error.message);
  res.json({ ok: true, users: data ?? [] });
}

export async function updateUser(req, res) {
  const { role, nitw_verified } = req.body ?? {};
  const patch = {};
  if (role !== undefined) {
    if (!USER_ROLES.has(role)) throw new HttpError(400, 'Invalid role.');
    patch.role = role;
  }
  if (nitw_verified !== undefined) patch.nitw_verified = Boolean(nitw_verified);
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, 'Nothing to update.');
  }
  // An admin can't demote themselves — avoids locking the whole console out.
  if (req.params.id === req.user.id && patch.role && patch.role !== 'admin') {
    throw new HttpError(400, "You can't remove your own admin access.");
  }
  const db = adminClient();
  const { data, error } = await db
    .from('users')
    .update(patch)
    .eq('id', req.params.id)
    .select('id, full_name, email, role, nitw_verified')
    .maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!data) throw new HttpError(404, 'User not found.');
  res.json({ ok: true, user: data });
}

// --- Offers: flag moderation ------------------------------------------------

export async function listFlaggedOffers(req, res) {
  const db = adminClient();
  const { data, error } = await db
    .from('offers')
    .select(
      'id, restaurant_id, title, description, discount_text, is_active, flagged_count, starts_at, expires_at, created_at',
    )
    .gt('flagged_count', 0)
    .order('flagged_count', { ascending: false });
  if (error) throw new HttpError(500, error.message);

  const restaurantIds = [...new Set((data ?? []).map((o) => o.restaurant_id))];
  const names = new Map();
  if (restaurantIds.length) {
    const { data: rows } = await db
      .from('restaurants')
      .select('id, name')
      .in('id', restaurantIds);
    for (const r of rows ?? []) names.set(r.id, r.name);
  }
  const offers = (data ?? []).map((o) => ({
    ...o,
    restaurantName: names.get(o.restaurant_id) ?? null,
  }));
  res.json({ ok: true, offers });
}

export async function moderateOffer(req, res) {
  const action = req.body?.action;
  if (action !== 'deactivate' && action !== 'clear_flags') {
    throw new HttpError(400, 'Action must be deactivate or clear_flags.');
  }
  const db = adminClient();
  if (action === 'deactivate') {
    const { error } = await db
      .from('offers')
      .update({ is_active: false })
      .eq('id', req.params.id);
    if (error) throw new HttpError(400, error.message);
    return res.json({ ok: true });
  }
  const { error } = await db
    .from('offers')
    .update({ flagged_count: 0 })
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function deleteOffer(req, res) {
  const db = adminClient();
  const { error } = await db.from('offers').delete().eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Reviews: moderation ----------------------------------------------------

export async function listReviews(req, res) {
  const db = adminClient();
  const restaurantId = req.query.restaurantId;
  let q = db
    .from('reviews')
    .select('id, restaurant_id, student_id, rating, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (restaurantId) q = q.eq('restaurant_id', restaurantId);
  const { data, error } = await q;
  if (error) throw new HttpError(500, error.message);

  const restaurantIds = [...new Set((data ?? []).map((r) => r.restaurant_id))];
  const studentIds = [...new Set((data ?? []).map((r) => r.student_id))];
  const [rNames, sNames] = await Promise.all([
    restaurantIds.length
      ? db.from('restaurants').select('id, name').in('id', restaurantIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? db.from('users').select('id, full_name, email').in('id', studentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const rMap = new Map((rNames.data ?? []).map((r) => [r.id, r.name]));
  const sMap = new Map((sNames.data ?? []).map((u) => [u.id, u]));
  const reviews = (data ?? []).map((r) => ({
    ...r,
    restaurantName: rMap.get(r.restaurant_id) ?? null,
    student: sMap.get(r.student_id) ?? null,
  }));
  res.json({ ok: true, reviews });
}

export async function deleteReview(req, res) {
  const db = adminClient();
  const { error } = await db.from('reviews').delete().eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}
