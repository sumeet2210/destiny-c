// The three Supabase clients, mirroring the Next app's client/server/admin split.
//
//   anonClient()      publishable key, no session — issues/verifies/refreshes
//                     auth tokens and serves anonymous public reads.
//   userClient(jwt)   publishable key + the caller's access token in the
//                     Authorization header — auth.uid() resolves, so RLS applies
//                     exactly as the Next per-request server client did.
//   adminClient()     service-role secret — bypasses RLS. Cron sweeps ONLY.
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/index.js';

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

export function anonClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, NO_SESSION);
}

export function userClient(accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...NO_SESSION,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function adminClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error(
      'Supabase admin not configured (URL or secret key missing)',
    );
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, NO_SESSION);
}
