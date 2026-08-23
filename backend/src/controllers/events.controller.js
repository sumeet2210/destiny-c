// Events reads (P3-6). Public and dual-mode. interest-counts returns a Map from
// the view layer, so it's converted to a plain object for JSON here.
import { anonClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import {
  listUpcomingEvents,
  getEventDetail,
  listEventInterestCounts,
} from '../lib/view/summary.js';
import { HttpError } from '../middleware/error.js';

const readClient = () => (isSupabaseConfigured() ? anonClient() : null);

export async function list(req, res) {
  res.json({ ok: true, events: await listUpcomingEvents(readClient()) });
}

export async function interestCounts(req, res) {
  const counts = await listEventInterestCounts(readClient());
  res.json({ ok: true, counts: Object.fromEntries(counts) });
}

export async function detail(req, res) {
  const found = await getEventDetail(readClient(), req.params.id);
  if (!found) throw new HttpError(404, 'Event not found.');
  res.json({ ok: true, ...found });
}
