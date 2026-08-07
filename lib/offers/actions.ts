'use server';

// P5-11: lightweight crowdsourced correction — a student flags an offer as
// wrong or expired; the owner sees the count.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function flagOffer(offerId: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) return { ok: true }; // seed mode: pretend
  const supabase = await createClient();
  const { error } = await supabase.rpc('flag_offer', { offer_id: offerId });
  return { ok: !error };
}
