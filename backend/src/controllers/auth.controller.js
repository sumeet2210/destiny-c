// Auth moved fully into Express: the browser holds the session and calls here.
// login/verify/signup/refresh return { access_token, refresh_token, expires_at,
// user }; the client stores them and sends Authorization: Bearer on every call.
// RLS still applies because every authed request rebuilds a user-scoped client.
import { anonClient, userClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../config/index.js';
import { isStudentEmail, STUDENT_EMAIL_DOMAINS } from '../config/auth.js';
import { HttpError } from '../middleware/error.js';

const NOT_CONFIGURED_MSG =
  'Auth needs a Supabase project. Add the env vars from .env.example to log in.';

/**
 * Supabase's raw auth errors read like developer logs. Translate the ones a
 * student can actually hit; log the rest and stay vague. Ported verbatim from
 * lib/auth/actions.ts.
 */
function friendlyAuthError(error) {
  const code = error.code ?? '';
  const raw = (error.message ?? '').toLowerCase();
  if (code === 'over_email_send_rate_limit' || raw.includes('rate limit')) {
    return "We can't send codes right now — give it a few minutes and try again.";
  }
  if (raw.includes('token has expired') || raw.includes('expired')) {
    return 'That code has expired. Request a new one.';
  }
  if (raw.includes('invalid') && raw.includes('token')) {
    return "That code didn't match. Check it and try again.";
  }
  if (raw.includes('email address') && raw.includes('invalid')) {
    return 'That email address looks wrong.';
  }
  console.error('[auth]', error.code ?? '', error.message);
  return 'Something went wrong on our side. Try again in a moment.';
}

function sessionPayload(session, user) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user,
  };
}

async function profileFor(accessToken, userId) {
  const { data } = await userClient(accessToken)
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export async function studentOtp(req, res) {
  if (!isSupabaseConfigured()) throw new HttpError(503, NOT_CONFIGURED_MSG);
  const { email } = req.body ?? {};
  if (!isStudentEmail(email ?? '')) {
    throw new HttpError(
      400,
      STUDENT_EMAIL_DOMAINS.length
        ? 'Use your NITW student email — that’s what keeps this campus-only.'
        : 'Enter a valid email address.',
    );
  }
  const { error } = await anonClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { role: 'student' } },
  });
  if (error) throw new HttpError(400, friendlyAuthError(error));
  res.json({ ok: true });
}

export async function studentVerify(req, res) {
  if (!isSupabaseConfigured()) throw new HttpError(503, NOT_CONFIGURED_MSG);
  const { email, token } = req.body ?? {};
  if (!email || !token) throw new HttpError(400, 'Enter the code we emailed you.');
  const { data, error } = await anonClient().auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw new HttpError(400, friendlyAuthError(error));
  const session = data.session;
  if (!session) {
    throw new HttpError(400, "That code didn't match. Check it and try again.");
  }
  // OTP over the institute domain is the verification (architecture.md §3).
  await userClient(session.access_token)
    .from('users')
    .update({ nitw_verified: true })
    .eq('id', session.user.id);
  const profile = await profileFor(session.access_token, session.user.id);
  res.json({ ok: true, ...sessionPayload(session, profile) });
}

export async function ownerLogin(req, res) {
  if (!isSupabaseConfigured()) throw new HttpError(503, NOT_CONFIGURED_MSG);
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');
  const { data, error } = await anonClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new HttpError(401, error.message);
  const profile = await profileFor(data.session.access_token, data.user.id);
  res.json({ ok: true, ...sessionPayload(data.session, profile) });
}

export async function ownerSignup(req, res) {
  if (!isSupabaseConfigured()) throw new HttpError(503, NOT_CONFIGURED_MSG);
  const { email, password, fullName } = req.body ?? {};
  if (!email || !password || !fullName) {
    throw new HttpError(400, 'Fill in every field to create your account.');
  }
  const { data, error } = await anonClient().auth.signUp({
    email,
    password,
    options: { data: { role: 'owner', full_name: fullName } },
  });
  if (error) throw new HttpError(400, error.message);
  if (!data.session) {
    // Email confirmation required — no session yet.
    return res.json({
      ok: true,
      message: 'Check your email to confirm the account, then log in.',
    });
  }
  const profile = await profileFor(data.session.access_token, data.user.id);
  res.json({ ok: true, ...sessionPayload(data.session, profile) });
}

export async function refresh(req, res) {
  if (!isSupabaseConfigured()) throw new HttpError(503, NOT_CONFIGURED_MSG);
  const { refresh_token } = req.body ?? {};
  if (!refresh_token) throw new HttpError(400, 'Missing refresh token.');
  const { data, error } = await anonClient().auth.refreshSession({
    refresh_token,
  });
  if (error || !data.session) {
    throw new HttpError(401, 'Session expired. Log in again.');
  }
  const profile = await profileFor(data.session.access_token, data.session.user.id);
  res.json({ ok: true, ...sessionPayload(data.session, profile) });
}

export async function logout(req, res) {
  // Best-effort server-side revoke; the client also drops its stored tokens.
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (isSupabaseConfigured() && token) {
    try {
      await userClient(token).auth.signOut();
    } catch {
      // The client discarding its tokens is what actually logs them out.
    }
  }
  res.json({ ok: true });
}

export async function me(req, res) {
  res.json({ ok: true, user: req.user });
}

/**
 * P9-3: activity sharing is opt-in and OFF by default. Also lets the student set
 * their hostel (shown to friends only) and phone. Only these fields are writable.
 */
export async function updateProfile(req, res) {
  const { hostel, share_activity, phone } = req.body ?? {};
  const patch = {};
  if (hostel !== undefined) patch.hostel = hostel;
  if (share_activity !== undefined) patch.share_activity = share_activity;
  if (phone !== undefined) patch.phone = phone;
  const { error } = await req.db.from('users').update(patch).eq('id', req.user.id);
  if (error) throw new HttpError(400, error.message);
  const { data } = await req.db
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();
  res.json({ ok: true, user: data ?? null });
}
