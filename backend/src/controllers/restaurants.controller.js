// Public catalog reads. Anonymous supabase client in live mode; the view layer
// serves seed data when Supabase isn't configured (client is ignored then).
import { anonClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import {
  listRestaurantSummaries,
  applyFilters,
  getRestaurantDetail,
  alsoLike,
} from '../lib/view/summary.js';
import { HttpError } from '../middleware/error.js';

const readClient = () => (isSupabaseConfigured() ? anonClient() : null);

/** Query-string → the filter shape applyFilters expects (PRD §5.3). */
function parseFilters(query) {
  const f = {};
  const truthy = (v) => v === 'true' || v === '1';
  if (query.craving) f.craving = String(query.craving);
  if (query.veg) f.veg = String(query.veg);
  if (truthy(query.openNow)) f.openNow = true;
  if (truthy(query.hasOffer)) f.hasOffer = true;
  if (query.price) f.price = String(query.price);
  if (query.area) f.area = String(query.area);
  if (query.vibe) f.vibe = String(query.vibe);
  if (truthy(query.discount)) f.discount = true;
  if (query.ac) f.ac = String(query.ac);
  if (query.service) f.service = String(query.service);
  if (query.minRating) f.minRating = Number(query.minRating);
  if (query.q) f.q = String(query.q);
  if (query.sort) f.sort = String(query.sort);
  return f;
}

export async function list(req, res) {
  const summaries = await listRestaurantSummaries(readClient());
  res.json({ ok: true, restaurants: applyFilters(summaries, parseFilters(req.query)) });
}

export async function detail(req, res) {
  const found = await getRestaurantDetail(readClient(), req.params.id);
  if (!found) throw new HttpError(404, 'Restaurant not found.');
  res.json({ ok: true, ...found });
}

export async function alsoLikeHandler(req, res) {
  res.json({ ok: true, restaurants: await alsoLike(readClient(), req.params.id) });
}
