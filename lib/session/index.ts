// Barrel for React consumers. Server-only code (the API client, Server
// Components) should import from '@/lib/session/store' directly to avoid
// pulling the client Provider into a server bundle.
export {
  SessionProvider,
  useSession,
  type SessionContextValue,
} from './SessionProvider';
export {
  SavedProvider,
  useSaved,
  type SavedContextValue,
} from './SavedProvider';
export {
  getSession,
  getAccessToken,
  setSession,
  patchSession,
  clearSession,
  subscribe,
  type SessionUser,
  type StoredSession,
} from './store';
