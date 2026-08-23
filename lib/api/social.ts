// Social graph: saved restaurants, friends, RSVPs, and friend activity. All
// student-authed. Reads restore the Set/Map shapes the old queries returned so
// consuming components don't change.
import { apiFetch, type ReadOptions } from './client';
import type { FriendsBundle, FriendActivity } from './types';

// --- Saved ------------------------------------------------------------------

export async function getSavedIds(opts: ReadOptions = {}): Promise<Set<string>> {
  const res = await apiFetch<{ ok: true; savedIds: string[] }>(
    '/social/saved',
    { auth: true, ...opts },
  );
  return new Set(res.savedIds);
}

/** Toggle a restaurant in the saved list; returns the new saved state. Routed
 *  under /restaurants/:id/save on the backend but a social concern here. */
export async function toggleSaved(restaurantId: string): Promise<boolean> {
  const res = await apiFetch<{ ok: true; saved: boolean }>(
    `/restaurants/${encodeURIComponent(restaurantId)}/save`,
    { method: 'POST', auth: true },
  );
  return res.saved;
}

// --- Friends ----------------------------------------------------------------

export async function getFriendsBundle(
  opts: ReadOptions = {},
): Promise<FriendsBundle> {
  const res = await apiFetch<{ ok: true } & FriendsBundle>('/social/friends', {
    auth: true,
    ...opts,
  });
  return { friends: res.friends, incoming: res.incoming, outgoing: res.outgoing };
}

export async function sendFriendRequest(email: string): Promise<void> {
  await apiFetch('/social/friends', {
    method: 'POST',
    auth: true,
    body: { email },
  });
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
): Promise<void> {
  await apiFetch(`/social/friends/${encodeURIComponent(friendshipId)}/respond`, {
    method: 'POST',
    auth: true,
    body: { accept },
  });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await apiFetch(`/social/friends/${encodeURIComponent(friendshipId)}`, {
    method: 'DELETE',
    auth: true,
  });
}

// --- RSVPs ------------------------------------------------------------------

export async function getMyRsvpIds(
  opts: ReadOptions = {},
): Promise<Set<string>> {
  const res = await apiFetch<{ ok: true; rsvpIds: string[] }>(
    '/social/rsvps',
    { auth: true, ...opts },
  );
  return new Set(res.rsvpIds);
}

/** Toggle attendance for an event; returns the new going state. Routed under
 *  /events/:id/rsvp on the backend. */
export async function toggleRsvp(eventId: string): Promise<boolean> {
  const res = await apiFetch<{ ok: true; going: boolean }>(
    `/events/${encodeURIComponent(eventId)}/rsvp`,
    { method: 'POST', auth: true },
  );
  return res.going;
}

// --- Friend activity --------------------------------------------------------

/** Which friends saved / are going to each restaurant/event. Backend sends plain
 *  objects keyed by id; restore the Maps the old query produced. */
export async function getFriendActivity(
  opts: ReadOptions = {},
): Promise<FriendActivity> {
  const res = await apiFetch<{
    ok: true;
    savedBy: Record<string, string[]>;
    goingTo: Record<string, string[]>;
  }>('/social/friend-activity', { auth: true, ...opts });
  return {
    savedBy: new Map(Object.entries(res.savedBy)),
    goingTo: new Map(Object.entries(res.goingTo)),
  };
}
