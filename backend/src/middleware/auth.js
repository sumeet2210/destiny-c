// Auth guards. Mirror the Next app's per-request identity model: the caller's
// Supabase access token (Bearer) becomes a user-scoped client on req.db, so
// every DB call runs under RLS as that user. No controller uses the service key.
import { userClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import { HttpError } from './error.js';

function bearer(req) {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

async function attachUser(req, token) {
  const db = userClient(token);
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return false;
  const { data: profile } = await db
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  req.authUser = user;
  req.user = profile ?? null;
  req.accessToken = token;
  req.db = db;
  return true;
}

/** Hard gate: 401 unless a valid access token is present. Sets req.user/req.db. */
export async function requireUser(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      throw new HttpError(503, 'This needs a live Supabase project.');
    }
    const token = bearer(req);
    if (!token) throw new HttpError(401, 'Log in first.');
    const ok = await attachUser(req, token);
    if (!ok) throw new HttpError(401, 'Session expired. Log in again.');
    next();
  } catch (err) {
    next(err);
  }
}

/** Soft: attaches req.user/req.db when a valid token is present, never 401s. */
export async function optionalUser(req, res, next) {
  try {
    const token = bearer(req);
    if (token && isSupabaseConfigured()) await attachUser(req, token);
  } catch {
    // Anonymous is fine for optional routes.
  }
  next();
}

/** Chain AFTER requireUser. */
export function requireStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return next(new HttpError(403, 'Students only.'));
  }
  next();
}

/** Chain AFTER requireUser. */
export function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return next(new HttpError(403, 'Owners only.'));
  }
  next();
}

/**
 * Chain AFTER requireUser. Gates the admin console. The schema has NO admin RLS
 * policies on purpose, so admin controllers run on the service-role client — this
 * check is the only thing standing in front of it. Never mount an admin route
 * without requireUser + requireAdmin.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Admins only.'));
  }
  next();
}
