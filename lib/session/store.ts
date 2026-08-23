// Framework-agnostic session store. Auth moved fully into Express (plan §Auth),
// so the browser is the session owner: tokens live in localStorage and every
// authed request carries `Authorization: Bearer <access_token>`.
//
// This module is deliberately React-free and has NO 'use client' directive so
// both the API client (lib/api/client.ts) and the React provider
// (lib/session/SessionProvider.tsx) can share ONE source of truth. When the API
// client silently refreshes or clears tokens on a 401, subscribers here are
// notified and the React tree re-renders — no second copy of the session to
// drift out of sync.
import type { Tables } from '@/types/db';

/** The `users` row as returned by the backend's auth endpoints. */
export type SessionUser = Tables<'users'>;

/** Everything we persist to survive a reload. Mirrors the backend's
 *  sessionPayload() shape (backend/src/controllers/auth.controller.js). */
export type StoredSession = {
  access_token: string;
  refresh_token: string;
  /** Unix seconds, from Supabase's session. Absent on older stored payloads. */
  expires_at?: number | null;
  user: SessionUser | null;
};

const STORAGE_KEY = 'destiny.session';

const listeners = new Set<() => void>();
let cache: StoredSession | null = null;
let hydrated = false;

/** Read localStorage once, lazily. On the server there is no session. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    cache = null;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Current session, or null. Reference identity is stable between mutations,
 *  which is what useSyncExternalStore's getSnapshot contract requires. */
export function getSession(): StoredSession | null {
  hydrate();
  return cache;
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function setSession(session: StoredSession): void {
  cache = session;
  hydrated = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Private-mode / quota failures shouldn't crash the app; the in-memory
      // cache still carries the session for this tab's lifetime.
    }
  }
  emit();
}

/** Merge a patch into the stored session (e.g. a refreshed `users` profile)
 *  without discarding the current tokens. No-op when logged out. */
export function patchSession(patch: Partial<StoredSession>): void {
  const next = getSession();
  if (!next) return;
  setSession({ ...next, ...patch });
}

export function clearSession(): void {
  cache = null;
  hydrated = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore; the in-memory clear below is what actually logs this tab out.
    }
  }
  emit();
}

/** Subscribe to session changes. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Cross-tab sync: a login/logout in another tab rewrites STORAGE_KEY; mirror it
// here so every open tab converges on the same session.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    hydrated = false;
    cache = null;
    hydrate();
    emit();
  });
}
