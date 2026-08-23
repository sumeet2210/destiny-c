// Bookings: student create/list/confirm/cancel + owner respond/note. All authed.
import { apiFetch, ApiError, type ReadOptions } from './client';
import type { StudentBooking } from './types';

export type CreateBookingInput = {
  restaurantId: string;
  bookingTime: string; // ISO
  bookingEndTime: string; // ISO
  headcount: number;
  specialRequest?: string;
  offerId?: string | null;
  eventId?: string | null;
};

/** Create a booking request. Returns the new booking id. Server re-validates the
 *  window, single-experience rule and headcount cap — surfaced as ApiError. */
export async function createBooking(
  input: CreateBookingInput,
): Promise<string> {
  const res = await apiFetch<{ ok: true; id: string }>('/bookings', {
    method: 'POST',
    auth: true,
    body: input,
  });
  return res.id;
}

export async function listStudentBookings(
  opts: ReadOptions = {},
): Promise<StudentBooking[]> {
  const res = await apiFetch<{ ok: true; bookings: StudentBooking[] }>(
    '/bookings',
    { auth: true, ...opts },
  );
  return res.bookings;
}

export async function getStudentBooking(
  id: string,
  opts: ReadOptions = {},
): Promise<StudentBooking | null> {
  try {
    const res = await apiFetch<{ ok: true; booking: StudentBooking }>(
      `/bookings/${encodeURIComponent(id)}`,
      { auth: true, ...opts },
    );
    return res.booking;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function confirmBooking(id: string): Promise<void> {
  await apiFetch(`/bookings/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    auth: true,
  });
}

export async function cancelBooking(id: string): Promise<void> {
  await apiFetch(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    auth: true,
  });
}

// --- Owner-side booking actions (owner console) -----------------------------

export async function respondToBooking(
  id: string,
  decision: 'accept' | 'reject',
): Promise<void> {
  await apiFetch(`/bookings/${encodeURIComponent(id)}/respond`, {
    method: 'POST',
    auth: true,
    body: { decision },
  });
}

export async function setBookingNote(id: string, note: string): Promise<void> {
  await apiFetch(`/bookings/${encodeURIComponent(id)}/note`, {
    method: 'PATCH',
    auth: true,
    body: { note },
  });
}
