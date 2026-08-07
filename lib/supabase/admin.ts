// Server-only client with the secret key — bypasses RLS. Used exclusively by
// cron sweep routes (P5-10, P6-7, P6-9). Never import from anything that could
// reach a client bundle.
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error('Supabase is not configured (URL or secret key missing)');
  }
  return createSupabaseClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
