'use client';

// Centralized saved-restaurants + event-RSVP state for the whole client tree.
//
// The Next server no longer holds the session, so overlays that used to be
// computed server-side (which cards are saved, which events you're going to)
// now resolve on the client. Doing that per-card would mean an N+1 storm of
// requests on every grid; instead this provider fetches each set ONCE when a
// student signs in and hands every consumer optimistic, shared state. Mounted
// once in app/layout.tsx, inside <SessionProvider>.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useSession } from './SessionProvider';
import {
  getMyRsvpIds,
  getSavedIds,
  toggleRsvp as apiToggleRsvp,
  toggleSaved as apiToggleSaved,
} from '@/lib/api/social';

export type SavedContextValue = {
  /** Only students can save/RSVP; false for owners, admins, and guests. */
  isStudent: boolean;
  /** True once the initial saved/RSVP prefetch has settled (success or not). */
  ready: boolean;
  isSaved: (restaurantId: string) => boolean;
  isGoing: (eventId: string) => boolean;
  /** Optimistically flip, reconcile with the server, revert + rethrow on error.
   *  Resolves to the authoritative new state. */
  toggleSave: (restaurantId: string) => Promise<boolean>;
  toggleGoing: (eventId: string) => Promise<boolean>;
};

const SavedContext = createContext<SavedContextValue | null>(null);

function flip(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
  setter((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function reconcile(
  setter: Dispatch<SetStateAction<Set<string>>>,
  id: string,
  present: boolean,
) {
  setter((current) => {
    const next = new Set(current);
    if (present) next.add(id);
    else next.delete(id);
    return next;
  });
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const { role, isAuthenticated } = useSession();
  const isStudent = isAuthenticated && role === 'student';

  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isStudent) {
      setSavedIds(new Set());
      setRsvpIds(new Set());
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    Promise.all([getSavedIds(), getMyRsvpIds()])
      .then(([saved, rsvps]) => {
        if (cancelled) return;
        setSavedIds(saved);
        setRsvpIds(rsvps);
      })
      .catch(() => {
        // A failed prefetch just means overlays start empty; toggles still work.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isStudent]);

  const toggleSave = useCallback(async (restaurantId: string) => {
    flip(setSavedIds, restaurantId);
    try {
      const serverState = await apiToggleSaved(restaurantId);
      reconcile(setSavedIds, restaurantId, serverState);
      return serverState;
    } catch (err) {
      flip(setSavedIds, restaurantId); // revert
      throw err;
    }
  }, []);

  const toggleGoing = useCallback(async (eventId: string) => {
    flip(setRsvpIds, eventId);
    try {
      const serverState = await apiToggleRsvp(eventId);
      reconcile(setRsvpIds, eventId, serverState);
      return serverState;
    } catch (err) {
      flip(setRsvpIds, eventId); // revert
      throw err;
    }
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({
      isStudent,
      ready,
      isSaved: (id: string) => savedIds.has(id),
      isGoing: (id: string) => rsvpIds.has(id),
      toggleSave,
      toggleGoing,
    }),
    [isStudent, ready, savedIds, rsvpIds, toggleSave, toggleGoing],
  );

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error('useSaved must be used within <SavedProvider>.');
  }
  return ctx;
}
