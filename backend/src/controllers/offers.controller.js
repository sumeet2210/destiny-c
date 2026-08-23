// Offers ticker (public read) + flag (P5-11 crowdsourced correction). Flag is
// anon-friendly and mirrors the Next action: seed mode pretends success, and the
// response is { ok: !error } so a failed flag never surfaces as an HTTP error.
import { anonClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import { listTickerOffers } from '../lib/view/summary.js';

export async function ticker(req, res) {
  const client = isSupabaseConfigured() ? anonClient() : null;
  res.json({ ok: true, offers: await listTickerOffers(client) });
}

export async function flag(req, res) {
  if (!isSupabaseConfigured()) return res.json({ ok: true }); // seed mode: pretend
  const db = req.db ?? anonClient();
  const { error } = await db.rpc('flag_offer', { offer_id: req.params.id });
  res.json({ ok: !error });
}
