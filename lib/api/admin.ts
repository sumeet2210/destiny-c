// Admin console API. Every call is admin-authed; the backend runs these on the
// service-role client behind requireUser -> requireAdmin. Maps 1:1 to
// backend/src/routes/admin.routes.js.
import { apiFetch, type ReadOptions } from './client';
import type {
  AdminOverview,
  AdminRestaurant,
  AdminUser,
  FlaggedOffer,
  AdminReview,
} from './types';

type RestaurantStatus = 'pending_approval' | 'active' | 'suspended';
type UserRole = 'student' | 'owner' | 'admin';

// --- Platform overview ------------------------------------------------------

export async function getOverview(
  opts: ReadOptions = {},
): Promise<AdminOverview> {
  const res = await apiFetch<{ ok: true; overview: AdminOverview }>(
    '/admin/overview',
    { auth: true, ...opts },
  );
  return res.overview;
}

// --- Restaurants ------------------------------------------------------------

export async function listRestaurants(
  status?: RestaurantStatus,
  opts: ReadOptions = {},
): Promise<AdminRestaurant[]> {
  const res = await apiFetch<{ ok: true; restaurants: AdminRestaurant[] }>(
    '/admin/restaurants',
    { auth: true, query: { status }, ...opts },
  );
  return res.restaurants;
}

export async function setRestaurantStatus(
  id: string,
  status: RestaurantStatus,
): Promise<void> {
  await apiFetch(`/admin/restaurants/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    auth: true,
    body: { status },
  });
}

// --- Users ------------------------------------------------------------------

export async function listUsers(
  params: { role?: UserRole; q?: string } = {},
  opts: ReadOptions = {},
): Promise<AdminUser[]> {
  const res = await apiFetch<{ ok: true; users: AdminUser[] }>('/admin/users', {
    auth: true,
    query: { role: params.role, q: params.q },
    ...opts,
  });
  return res.users;
}

export async function updateUser(
  id: string,
  patch: { role?: UserRole; nitw_verified?: boolean },
): Promise<AdminUser> {
  const res = await apiFetch<{ ok: true; user: AdminUser }>(
    `/admin/users/${encodeURIComponent(id)}`,
    { method: 'PATCH', auth: true, body: patch },
  );
  return res.user;
}

// --- Offer moderation -------------------------------------------------------

export async function listFlaggedOffers(
  opts: ReadOptions = {},
): Promise<FlaggedOffer[]> {
  const res = await apiFetch<{ ok: true; offers: FlaggedOffer[] }>(
    '/admin/offers/flagged',
    { auth: true, ...opts },
  );
  return res.offers;
}

export async function moderateOffer(
  id: string,
  action: 'deactivate' | 'clear_flags',
): Promise<void> {
  await apiFetch(`/admin/offers/${encodeURIComponent(id)}/moderate`, {
    method: 'POST',
    auth: true,
    body: { action },
  });
}

export async function deleteOffer(id: string): Promise<void> {
  await apiFetch(`/admin/offers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}

// --- Review moderation ------------------------------------------------------

export async function listReviews(
  restaurantId?: string,
  opts: ReadOptions = {},
): Promise<AdminReview[]> {
  const res = await apiFetch<{ ok: true; reviews: AdminReview[] }>(
    '/admin/reviews',
    { auth: true, query: { restaurantId }, ...opts },
  );
  return res.reviews;
}

export async function deleteReview(id: string): Promise<void> {
  await apiFetch(`/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  });
}
