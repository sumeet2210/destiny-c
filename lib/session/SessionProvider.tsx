'use client';

// Client-side session context. Backed by the framework-agnostic store
// (./store), which is also written by the API client's silent refresh — so
// there is exactly one source of truth and the tree re-renders whenever tokens
// change, from anywhere. Mounted once in app/layout.tsx.
//
// Per node_modules/next/dist/docs/.../05-server-and-client-components.md, a
// context provider must be a Client Component; the server layout renders it
// around {children}. getServerSnapshot returns null so SSR renders the
// logged-out tree and client hydration matches before reading localStorage.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  clearSession,
  getSession,
  setSession,
  subscribe,
  type SessionUser,
  type StoredSession,
} from './store';
import { logout as apiLogout, me as apiMe } from '@/lib/api/auth';

type Role = SessionUser['role'];

export type SessionContextValue = {
  session: StoredSession | null;
  user: SessionUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** Persist a freshly-issued session (after login / verify / signup). */
  signIn: (session: StoredSession) => void;
  /** Best-effort server revoke, then drop local tokens. */
  signOut: () => Promise<void>;
  /** Re-fetch /auth/me and refresh the stored profile. */
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const serverSnapshot = (): StoredSession | null => null;

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession, serverSnapshot);

  const signIn = useCallback((next: StoredSession) => {
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Local clear is the real logout; ignore server/transport errors.
    } finally {
      clearSession();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getSession()) return;
    await apiMe(); // patches the stored user on success
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(session?.access_token),
      signIn,
      signOut,
      refresh,
    };
  }, [session, signIn, signOut, refresh]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within <SessionProvider>.');
  }
  return ctx;
}
