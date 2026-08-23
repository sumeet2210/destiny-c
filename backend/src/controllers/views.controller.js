// P3-13: profile-view logger. Anon-friendly (viewer_id is nullable) so it runs
// with optionalUser — a logged-in viewer is stamped, an anonymous one isn't.
// Best-effort and dual-mode: seed mode acknowledges without writing.
import { anonClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';

const KNOWN_SOURCES = new Set([
  'homepage_feed',
  'search',
  'quiz',
  'events',
  'friend_activity',
  'direct',
]);

export async function logView(req, res) {
  const { restaurantId, source } = req.body ?? {};
  if (!restaurantId || typeof restaurantId !== 'string') {
    return res.status(400).json({ ok: false });
  }
  const sourceFilter =
    typeof source === 'string' &&
    (KNOWN_SOURCES.has(source) || source.startsWith('craving:'))
      ? source.slice(0, 64)
      : 'direct';

  if (!isSupabaseConfigured()) return res.json({ ok: true, mode: 'seed' });

  const db = req.db ?? anonClient();
  await db.from('profile_views').insert({
    restaurant_id: restaurantId,
    viewer_id: req.authUser?.id ?? null,
    source_filter: sourceFilter,
  });
  res.json({ ok: true });
}
