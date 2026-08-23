// The catalog fetch, ported from lib/queries/catalog.ts. Dual-mode: the typed
// seed when Supabase isn't configured, live rows otherwise. The caller passes
// the supabase client (anon for public reads) — there's no cookie/React-cache
// machinery here; each request fetches once and the pure shapers do the rest.
import { isSupabaseConfigured } from '../../config/index.js';
import {
  seedEvents,
  seedMenuItems,
  seedOffers,
  seedPhotos,
  seedRestaurants,
  seedReviews,
} from '../data/seed.js';

export async function getCatalog(client) {
  if (!isSupabaseConfigured()) {
    return {
      restaurants: seedRestaurants.filter((r) => r.status === 'active'),
      menuItems: seedMenuItems,
      offers: seedOffers.filter(
        (o) => o.is_active && new Date(o.expires_at).getTime() > Date.now(),
      ),
      photos: seedPhotos,
      events: seedEvents.filter((e) => !e.is_cancelled),
      reviews: seedReviews,
      trendingViews: new Map(
        seedRestaurants.map((r, i) => [
          r.id,
          [40, 65, 22, 31, 54, 48][i] ?? 10,
        ]),
      ),
    };
  }

  const [restaurants, menuItems, offers, photos, events, reviews, trending] =
    await Promise.all([
      client.from('restaurants').select('*').eq('status', 'active'),
      client.from('menu_items').select('*'),
      client
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()),
      client.from('restaurant_photos').select('*').order('sort_order'),
      client.from('events').select('*').eq('is_cancelled', false),
      client.from('reviews').select('*'),
      client.rpc('trending_restaurants'),
    ]);

  return {
    restaurants: restaurants.data ?? [],
    menuItems: menuItems.data ?? [],
    offers: offers.data ?? [],
    photos: photos.data ?? [],
    events: events.data ?? [],
    reviews: reviews.data ?? [],
    trendingViews: new Map(
      (trending.data ?? []).map((t) => [t.restaurant_id, Number(t.views)]),
    ),
  };
}
