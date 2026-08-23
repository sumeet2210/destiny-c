// Auth API wrapper. Maps 1:1 to backend/src/routes/auth.routes.js. Session-
// issuing calls persist tokens to the store as a side effect so the rest of the
// app can just read useSession(); all calls throw ApiError on failure (the
// caller decides how to surface the message).
import { apiFetch } from './client';
import {
  clearSession,
  patchSession,
  setSession,
  type SessionUser,
  type StoredSession,
} from '@/lib/session/store';

/** Shape returned by verify / login / signup / refresh on success. */
type SessionResponse = {
  ok: true;
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
  user: SessionUser | null;
};

function persist(res: SessionResponse): StoredSession {
  const session: StoredSession = {
    access_token: res.access_token,
    refresh_token: res.refresh_token,
    expires_at: res.expires_at,
    user: res.user,
  };
  setSession(session);
  return session;
}

/** Student login step 1: email the one-time code. */
export function requestStudentOtp(email: string): Promise<void> {
  return apiFetch('/auth/student/otp', {
    method: 'POST',
    body: { email },
  }).then(() => undefined);
}

/** Student login step 2: verify the code, store the session. */
export async function verifyStudentOtp(
  email: string,
  token: string,
): Promise<StoredSession> {
  const res = await apiFetch<SessionResponse>('/auth/student/verify', {
    method: 'POST',
    body: { email, token },
  });
  return persist(res);
}

export async function ownerLogin(
  email: string,
  password: string,
): Promise<StoredSession> {
  const res = await apiFetch<SessionResponse>('/auth/owner/login', {
    method: 'POST',
    body: { email, password },
  });
  return persist(res);
}

/** Owner signup. When email confirmation is required the backend returns no
 *  session — surfaced here as { session: null, message }. */
export async function ownerSignup(
  email: string,
  password: string,
  fullName: string,
): Promise<{ session: StoredSession | null; message?: string }> {
  const res = await apiFetch<SessionResponse & { message?: string }>(
    '/auth/owner/signup',
    { method: 'POST', body: { email, password, fullName } },
  );
  if (!res.access_token) return { session: null, message: res.message };
  return { session: persist(res) };
}

/** Best-effort server-side revoke, then drop local tokens regardless. */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST', auth: true });
  } finally {
    clearSession();
  }
}

/** Current user profile; refreshes the stored copy on success. */
export async function me(): Promise<SessionUser | null> {
  const res = await apiFetch<{ ok: true; user: SessionUser | null }>(
    '/auth/me',
    { auth: true },
  );
  patchSession({ user: res.user });
  return res.user;
}

export async function updateProfile(input: {
  hostel?: string | null;
  share_activity?: boolean;
  phone?: string | null;
}): Promise<SessionUser | null> {
  const res = await apiFetch<{ ok: true; user: SessionUser | null }>(
    '/auth/profile',
    { method: 'PATCH', auth: true, body: input },
  );
  patchSession({ user: res.user });
  return res.user;
}
