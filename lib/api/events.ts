// Events reads. All public (Server-Component friendly via ReadOptions).
import { apiFetch, ApiError, type ReadOptions } from './client';
import type { UpcomingEvent, EventDetail } from './types';

export async function listUpcomingEvents(
  opts: ReadOptions = {},
): Promise<UpcomingEvent[]> {
  const res = await apiFetch<{ ok: true; events: UpcomingEvent[] }>(
    '/events',
    opts,
  );
  return res.events;
}

/** Interest (RSVP) tallies keyed by event id. The backend sends a plain object;
 *  restore the Map the old query returned so callers are unchanged. */
export async function listEventInterestCounts(
  opts: ReadOptions = {},
): Promise<Map<string, number>> {
  const res = await apiFetch<{ ok: true; counts: Record<string, number> }>(
    '/events/interest-counts',
    opts,
  );
  return new Map(Object.entries(res.counts));
}

export async function getEventDetail(
  id: string,
  opts: ReadOptions = {},
): Promise<EventDetail | null> {
  try {
    return await apiFetch<{ ok: true } & EventDetail>(
      `/events/${encodeURIComponent(id)}`,
      opts,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
