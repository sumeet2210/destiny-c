// Catalog reads. Public — safe to call anonymously from Server Components, which
// forward { cache }/{ revalidate } via ReadOptions to opt into Next's fetch cache.
import { apiFetch, ApiError, type ReadOptions } from './client';
import type {
  RestaurantSummary,
  RestaurantDetail,
  CatalogFilters,
} from './types';

// The backend parses each filter key by name; a named type isn't assignable to
// the client's Record<string, QueryValue> index signature, so spell it out.
function filtersToQuery(f: CatalogFilters) {
  return {
    craving: f.craving,
    veg: f.veg,
    openNow: f.openNow,
    hasOffer: f.hasOffer,
    price: f.price,
    area: f.area,
    vibe: f.vibe,
    discount: f.discount,
    ac: f.ac,
    service: f.service,
    minRating: f.minRating,
    q: f.q,
    sort: f.sort,
  };
}

export async function listRestaurants(
  filters: CatalogFilters = {},
  opts: ReadOptions = {},
): Promise<RestaurantSummary[]> {
  const res = await apiFetch<{ ok: true; restaurants: RestaurantSummary[] }>(
    '/restaurants',
    { query: filtersToQuery(filters), ...opts },
  );
  return res.restaurants;
}

export async function getRestaurantDetail(
  id: string,
  opts: ReadOptions = {},
): Promise<RestaurantDetail | null> {
  try {
    // The success envelope is { ok, ...RestaurantDetail }; the extra `ok` is a
    // harmless excess property when returned as RestaurantDetail.
    return await apiFetch<{ ok: true } & RestaurantDetail>(
      `/restaurants/${encodeURIComponent(id)}`,
      opts,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function alsoLike(
  id: string,
  opts: ReadOptions = {},
): Promise<RestaurantSummary[]> {
  const res = await apiFetch<{ ok: true; restaurants: RestaurantSummary[] }>(
    `/restaurants/${encodeURIComponent(id)}/also-like`,
    opts,
  );
  return res.restaurants;
}
