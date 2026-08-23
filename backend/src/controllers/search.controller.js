// Search reads (P3-5): the homepage quick-search index and dish-level search.
// Public and dual-mode via the view layer.
import { anonClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import { listQuickSearchIndex, searchDishes } from '../lib/view/summary.js';

const readClient = () => (isSupabaseConfigured() ? anonClient() : null);

export async function index(req, res) {
  res.json({ ok: true, ...(await listQuickSearchIndex(readClient())) });
}

export async function dishes(req, res) {
  const hits = await searchDishes(readClient(), String(req.query.q ?? ''));
  res.json({ ok: true, dishes: hits });
}
