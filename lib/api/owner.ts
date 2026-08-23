// Owner console: reads (bundle/bookings/analytics) + all restaurant management
// writes. Every call is owner-authed; the backend enforces ownership via RLS on
// the user-scoped client. Field names match owner.controller.js exactly.
import { apiFetch, type ReadOptions } from './client';
import type { Tables } from '@/types/db';
import type { OwnerBundle, OwnerBooking, AnalyticsBundle } from './types';

// --- Reads ------------------------------------------------------------------

/** The owner's restaurant + menu/offers/events/photos, or null before setup. */
export async function getOwnerBundle(
  opts: ReadOptions = {},
): Promise<OwnerBundle | null> {
  const res = await apiFetch<{ ok: true; bundle: OwnerBundle | null }>(
    '/owner/bundle',
    { auth: true, ...opts },
  );
  return res.bundle;
}

export async function listOwnerBookings(
  opts: ReadOptions = {},
): Promise<OwnerBooking[]> {
  const res = await apiFetch<{ ok: true; bookings: OwnerBooking[] }>(
    '/owner/bookings',
    { auth: true, ...opts },
  );
  return res.bookings;
}

export async function getOwnerAnalytics(
  opts: ReadOptions = {},
): Promise<AnalyticsBundle | null> {
  const res = await apiFetch<{ ok: true; analytics: AnalyticsBundle | null }>(
    '/owner/analytics',
    { auth: true, ...opts },
  );
  return res.analytics;
}

// --- Restaurant profile -----------------------------------------------------

export type CreateRestaurantInput = {
  name: string;
  area: string;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export async function createRestaurant(
  input: CreateRestaurantInput,
): Promise<void> {
  await apiFetch('/owner/restaurant', {
    method: 'POST',
    auth: true,
    body: input,
  });
}

/** Patch editable restaurant columns. status/owner_id/id are stripped server-
 *  side, so passing them is harmless. */
export type RestaurantPatch = Partial<Tables<'restaurants'>>;

export async function updateRestaurant(patch: RestaurantPatch): Promise<void> {
  await apiFetch('/owner/restaurant', {
    method: 'PATCH',
    auth: true,
    body: patch,
  });
}

// --- Menu -------------------------------------------------------------------

export type MenuItemInput = {
  id?: string; // present → update, absent → insert
  name: string;
  price: number;
  is_veg: boolean;
  craving_tags: string[];
  is_available: boolean;
};

export async function upsertMenuItem(input: MenuItemInput): Promise<void> {
  await apiFetch('/owner/menu', { method: 'POST', auth: true, body: input });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiFetch(`/owner/menu/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}

// --- Offers -----------------------------------------------------------------

export type CreateOfferInput = {
  title: string;
  description?: string | null;
  discount_text?: string | null;
  expires_at?: string | null; // ISO; backend defaults to end-of-day IST
};

export async function createOffer(input: CreateOfferInput): Promise<void> {
  await apiFetch('/owner/offers', { method: 'POST', auth: true, body: input });
}

export type OfferPatch = Partial<{
  title: string;
  description: string | null;
  discount_text: string | null;
  expires_at: string;
  is_active: boolean;
}>;

export async function updateOffer(
  id: string,
  patch: OfferPatch,
): Promise<void> {
  await apiFetch(`/owner/offers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: true,
    body: patch,
  });
}

// --- Events -----------------------------------------------------------------

export type EventInput = {
  id?: string; // present → update, absent → insert
  title: string;
  event_type: Tables<'events'>['event_type'];
  starts_at: string; // ISO
  description?: string | null;
  ends_at?: string | null;
  entry_fee?: number | null;
  location_details?: string | null;
  ticket_url?: string | null;
  is_cancelled?: boolean;
};

export async function upsertEvent(input: EventInput): Promise<void> {
  await apiFetch('/owner/events', { method: 'POST', auth: true, body: input });
}

// --- Photos -----------------------------------------------------------------

/** Upload a (client-resized WebP) photo. Returns its public URL. When asCover is
 *  set the image becomes the restaurant cover instead of a gallery/menu photo. */
export async function uploadPhoto(
  file: File | Blob,
  opts: { kind?: 'gallery' | 'menu_photo'; asCover?: boolean } = {},
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  if (opts.kind) form.append('kind', opts.kind);
  if (opts.asCover) form.append('as_cover', '1');
  const res = await apiFetch<{ ok: true; url: string }>('/owner/photos', {
    method: 'POST',
    auth: true,
    body: form,
  });
  return res.url;
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetch(`/owner/photos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function reorderPhotos(ids: string[]): Promise<void> {
  await apiFetch('/owner/photos/reorder', {
    method: 'POST',
    auth: true,
    body: { ids },
  });
}
