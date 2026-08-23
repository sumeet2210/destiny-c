// Phase 5: owner tools + reads. RLS is the real gate on every write — these run
// with the owner's user-scoped client (req.db), never the service key. Reads are
// delegated to lib/view/owner.js. Ported from lib/owner/actions.ts and
// lib/queries/owner.ts.
import {
  getOwnerBundle,
  listOwnerBookings,
  getOwnerAnalytics,
} from '../lib/view/owner.js';
import { HttpError } from '../middleware/error.js';

// File arrives pre-resized to WebP from the client; the server re-checks size.
const MAX_UPLOAD_BYTES = 1_500_000;

/** The caller's restaurant id, or throw a friendly 404. */
async function ownedRestaurantId(db, me) {
  const { data } = await db
    .from('restaurants')
    .select('id')
    .eq('owner_id', me.id)
    .maybeSingle();
  if (!data) throw new HttpError(404, 'No restaurant on this account yet.');
  return data.id;
}

// --- Reads ------------------------------------------------------------------

export async function bundle(req, res) {
  res.json({ ok: true, bundle: await getOwnerBundle(req.db, req.user) });
}

export async function bookings(req, res) {
  res.json({ ok: true, bookings: await listOwnerBookings(req.db, req.user) });
}

export async function analytics(req, res) {
  res.json({ ok: true, analytics: await getOwnerAnalytics(req.db, req.user) });
}

// --- Restaurant profile (P4-3 create, P5-2 edit, P5-3 hours) ----------------

export async function createRestaurant(req, res) {
  const { name, area, address, phone, description, lat, lng } = req.body ?? {};
  const { error } = await req.db.from('restaurants').insert({
    name,
    area,
    address,
    phone,
    description,
    lat: lat ?? null,
    lng: lng ?? null,
    owner_id: req.user.id,
    status: 'pending_approval',
  });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function updateRestaurant(req, res) {
  const id = await ownedRestaurantId(req.db, req.user);
  const patch = { ...(req.body ?? {}) };
  // Never let the owner touch status or ownership from here.
  delete patch.status;
  delete patch.owner_id;
  delete patch.id;
  const { error } = await req.db.from('restaurants').update(patch).eq('id', id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Menu (P5-4) ------------------------------------------------------------

export async function upsertMenuItem(req, res) {
  const id = await ownedRestaurantId(req.db, req.user);
  const { id: itemId, name, price, is_veg, craving_tags, is_available } =
    req.body ?? {};
  const fields = { name, price, is_veg, craving_tags, is_available };
  const { error } = itemId
    ? await req.db.from('menu_items').update(fields).eq('id', itemId)
    : await req.db.from('menu_items').insert({ ...fields, restaurant_id: id });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function deleteMenuItem(req, res) {
  const { error } = await req.db
    .from('menu_items')
    .delete()
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Offers (P5-7, P5-8) ----------------------------------------------------

export async function createOffer(req, res) {
  const id = await ownedRestaurantId(req.db, req.user);
  const { title, description, discount_text, expires_at } = req.body ?? {};

  let expires = expires_at;
  if (!expires) {
    // End of today in IST (PRD §5.5).
    const eod = new Date(Date.now() + 330 * 60_000);
    eod.setUTCHours(23, 59, 59, 0);
    expires = new Date(eod.getTime() - 330 * 60_000).toISOString();
  }

  const { error } = await req.db.from('offers').insert({
    restaurant_id: id,
    title,
    description: description || null,
    discount_text: discount_text || null,
    expires_at: expires,
  });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

export async function updateOffer(req, res) {
  const { title, description, discount_text, expires_at, is_active } =
    req.body ?? {};
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (discount_text !== undefined) patch.discount_text = discount_text;
  if (expires_at !== undefined) patch.expires_at = expires_at;
  if (is_active !== undefined) patch.is_active = is_active;
  const { error } = await req.db
    .from('offers')
    .update(patch)
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Events (P5-9) ----------------------------------------------------------

export async function upsertEvent(req, res) {
  const id = await ownedRestaurantId(req.db, req.user);
  const input = req.body ?? {};
  const startsAt = new Date(input.starts_at);
  const publishLimit = Date.now() + 15 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(startsAt.getTime())) {
    throw new HttpError(422, 'Choose a valid event date and time.');
  }
  if (startsAt.getTime() > publishLimit) {
    throw new HttpError(422, 'Events can be scheduled up to 15 days ahead.');
  }
  if (input.ticket_url) {
    try {
      const ticketUrl = new URL(input.ticket_url);
      if (!['http:', 'https:'].includes(ticketUrl.protocol)) throw new Error();
    } catch {
      throw new HttpError(422, 'Ticket link must be a valid web address.');
    }
  }

  const payload = {
    title: input.title,
    event_type: input.event_type,
    starts_at: input.starts_at,
    description: input.description || null,
    ends_at: input.ends_at || null,
    entry_fee: input.entry_fee ?? null,
    location_details: input.location_details || null,
    ticket_url: input.ticket_url || null,
  };
  // Only carry is_cancelled when explicitly provided (e.g. a cancel toggle);
  // otherwise let the DB default apply on insert.
  if (input.is_cancelled !== undefined) payload.is_cancelled = input.is_cancelled;

  const { error } = input.id
    ? await req.db.from('events').update(payload).eq('id', input.id)
    : await req.db.from('events').insert({ ...payload, restaurant_id: id });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true });
}

// --- Photos (P5-5, P5-6) ----------------------------------------------------

export async function uploadPhoto(req, res) {
  const id = await ownedRestaurantId(req.db, req.user);
  const file = req.file;
  const kind = req.body?.kind === 'menu_photo' ? 'menu_photo' : 'gallery';
  const asCover = req.body?.as_cover === '1' || req.body?.as_cover === 'true';
  if (!file || file.size === 0) throw new HttpError(400, 'No file received.');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, 'Image is too large even after resizing.');
  }

  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error: uploadError } = await req.db.storage
    .from('restaurant-images')
    .upload(path, file.buffer, { contentType: 'image/webp' });
  if (uploadError) throw new HttpError(400, uploadError.message);

  const {
    data: { publicUrl },
  } = req.db.storage.from('restaurant-images').getPublicUrl(path);

  if (asCover) {
    const { error } = await req.db
      .from('restaurants')
      .update({ cover_image_url: publicUrl })
      .eq('id', id);
    if (error) throw new HttpError(400, error.message);
  } else {
    const { error } = await req.db
      .from('restaurant_photos')
      .insert({ restaurant_id: id, url: publicUrl, kind });
    if (error) throw new HttpError(400, error.message);
  }
  res.json({ ok: true, url: publicUrl });
}

export async function deletePhoto(req, res) {
  const db = req.db;
  const { data: photo } = await db
    .from('restaurant_photos')
    .select('url')
    .eq('id', req.params.id)
    .maybeSingle();
  const { error } = await db
    .from('restaurant_photos')
    .delete()
    .eq('id', req.params.id);
  if (error) throw new HttpError(400, error.message);
  // Best-effort storage cleanup.
  if (photo?.url) {
    const marker = '/restaurant-images/';
    const idx = photo.url.indexOf(marker);
    if (idx !== -1) {
      await db.storage
        .from('restaurant-images')
        .remove([photo.url.slice(idx + marker.length)]);
    }
  }
  res.json({ ok: true });
}

export async function reorderPhotos(req, res) {
  const ids = req.body?.ids ?? [];
  for (let i = 0; i < ids.length; i++) {
    const { error } = await req.db
      .from('restaurant_photos')
      .update({ sort_order: i })
      .eq('id', ids[i]);
    if (error) throw new HttpError(400, error.message);
  }
  res.json({ ok: true });
}
