// Search reads. Public.
import { apiFetch, type ReadOptions } from './client';
import type { QuickSearchIndex, DishHit } from './types';

/** Lightweight index powering the quick-search palette. */
export async function getQuickSearchIndex(
  opts: ReadOptions = {},
): Promise<QuickSearchIndex> {
  const res = await apiFetch<{ ok: true } & QuickSearchIndex>(
    '/search/index',
    opts,
  );
  return { restaurants: res.restaurants, dishes: res.dishes };
}

export async function searchDishes(
  q: string,
  opts: ReadOptions = {},
): Promise<DishHit[]> {
  if (!q.trim()) return [];
  const res = await apiFetch<{ ok: true; dishes: DishHit[] }>(
    '/search/dishes',
    { query: { q }, ...opts },
  );
  return res.dishes;
}
