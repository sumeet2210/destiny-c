// View models + filters, ported from lib/queries/catalog.ts. Pure shaping over
// a fetched Catalog — one implementation serves both seed and live modes, so
// they behave identically. Client-scoped readers take the supabase client and
// fetch the catalog once per call (in-memory filtering is fine at pilot scale).
import { PRICE_BUCKETS } from '../../config/price-buckets.js';
import { isSupabaseConfigured } from '../../config/index.js';
import { seedEvents } from '../data/seed.js';
import { isOpenToday, isOpenAt, minutesUntilClose } from '../domain/hours.js';
import { getCatalog } from './catalog.js';

export function toSummary(r, catalog, at = new Date()) {
  const hours = r.opening_hours ?? null;
  const gallery = catalog.photos
    .filter((p) => p.restaurant_id === r.id && p.kind === 'gallery')
    .map((p) => p.url);
  const photos = [
    ...(r.cover_image_url ? [r.cover_image_url] : []),
    ...gallery.filter((u) => u !== r.cover_image_url),
  ];
  const ratings = catalog.reviews
    .filter((v) => v.restaurant_id === r.id)
    .map((v) => v.rating);
  const offers = catalog.offers
    .filter((o) => o.restaurant_id === r.id)
    .sort(
      (a, b) =>
        new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime(),
    );
  const upcomingEvents = catalog.events
    .filter(
      (event) =>
        event.restaurant_id === r.id &&
        new Date(event.starts_at).getTime() > at.getTime() - 4 * 3_600_000,
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const cravingTags = [
    ...new Set(
      catalog.menuItems
        .filter((m) => m.restaurant_id === r.id)
        .flatMap((m) => m.craving_tags),
    ),
  ];

  return {
    id: r.id,
    name: r.name,
    area: r.area,
    lat: r.lat === null ? null : Number(r.lat),
    lng: r.lng === null ? null : Number(r.lng),
    price_per_head: r.price_per_head,
    is_veg_only: r.is_veg_only,
    has_ac: r.has_ac,
    dine_in: r.dine_in,
    takeaway: r.takeaway,
    student_discount: r.student_discount,
    vibe_tags: r.vibe_tags,
    photos,
    cravingTags,
    isOpen: isOpenAt(hours, at),
    isOpenToday: isOpenToday(hours, at),
    closingInMinutes: minutesUntilClose(hours, at),
    rating: ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null,
    reviewCount: ratings.length,
    trendingViews: catalog.trendingViews.get(r.id) ?? 0,
    liveOffer: offers[0]
      ? {
          title: offers[0].title,
          discount_text: offers[0].discount_text,
          expires_at: offers[0].expires_at,
        }
      : null,
    upcomingEvent: upcomingEvents[0]
      ? {
          title: upcomingEvents[0].title,
          starts_at: upcomingEvents[0].starts_at,
          event_type: upcomingEvents[0].event_type,
        }
      : null,
  };
}

export async function listRestaurantSummaries(client) {
  const catalog = await getCatalog(client);
  return catalog.restaurants.map((r) => toSummary(r, catalog));
}

// Filters — one implementation for both data sources (PRD §5.3).
export function applyFilters(list, f = {}) {
  let out = list;
  if (f.craving) out = out.filter((r) => r.cravingTags.includes(f.craving));
  if (f.veg === 'veg') out = out.filter((r) => r.is_veg_only);
  if (f.veg === 'nonveg') out = out.filter((r) => !r.is_veg_only);
  if (f.openNow) out = out.filter((r) => r.isOpen);
  if (f.hasOffer) out = out.filter((r) => r.liveOffer !== null);
  if (f.price) {
    const bucket = PRICE_BUCKETS.find((b) => b.key === f.price);
    if (bucket) {
      out = out.filter(
        (r) =>
          r.price_per_head !== null &&
          r.price_per_head >= bucket.min &&
          (bucket.max === null || r.price_per_head < bucket.max),
      );
    }
  }
  if (f.area) out = out.filter((r) => r.area === f.area);
  if (f.vibe) out = out.filter((r) => r.vibe_tags.includes(f.vibe));
  if (f.discount) out = out.filter((r) => r.student_discount);
  if (f.ac === 'ac') out = out.filter((r) => r.has_ac);
  if (f.ac === 'nonac') out = out.filter((r) => !r.has_ac);
  if (f.service === 'dinein') out = out.filter((r) => r.dine_in);
  if (f.service === 'takeaway') out = out.filter((r) => r.takeaway);
  if (f.minRating)
    out = out.filter((r) => r.rating !== null && r.rating >= f.minRating);
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter((r) => r.name.toLowerCase().includes(q));
  }

  switch (f.sort) {
    case 'price_asc':
      out = [...out].sort(
        (a, b) =>
          (a.price_per_head ?? Infinity) - (b.price_per_head ?? Infinity),
      );
      break;
    case 'rating':
      out = [...out].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    case 'trending':
    default:
      out = [...out].sort((a, b) => b.trendingViews - a.trendingViews);
      break;
    // 'nearest' sorts client-side where the coordinates live (PRD §5.4).
  }
  return out;
}

export async function getRestaurantDetail(client, id) {
  const catalog = await getCatalog(client);
  const row = catalog.restaurants.find((r) => r.id === id);
  if (!row) return null;
  const now = Date.now();
  return {
    summary: toSummary(row, catalog),
    row,
    menu: catalog.menuItems
      .filter((m) => m.restaurant_id === id)
      .sort((a, b) => a.name.localeCompare(b.name)),
    menuPhotos: catalog.photos
      .filter((p) => p.restaurant_id === id && p.kind === 'menu_photo')
      .map((p) => p.url),
    offers: catalog.offers
      .filter((o) => o.restaurant_id === id)
      .sort(
        (a, b) =>
          new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime(),
      ),
    events: catalog.events
      .filter(
        (e) =>
          e.restaurant_id === id &&
          new Date(e.starts_at).getTime() > now - 4 * 3_600_000,
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      )
      .map((e) => ({ ...e, restaurantName: row.name })),
    reviews: catalog.reviews.filter((v) => v.restaurant_id === id),
  };
}

/** Today's specials ticker: live offers sorted by soonest expiry (P3-1). */
export async function listTickerOffers(client) {
  const catalog = await getCatalog(client);
  return catalog.offers
    .map((o) => {
      const restaurant = catalog.restaurants.find(
        (r) => r.id === o.restaurant_id,
      );
      return {
        ...o,
        restaurantName: restaurant?.name ?? '',
        restaurantAddress:
          restaurant?.address || restaurant?.area || 'Warangal',
        restaurantLat: restaurant?.lat ?? null,
        restaurantLng: restaurant?.lng ?? null,
      };
    })
    .filter((o) => o.restaurantName)
    .sort(
      (a, b) =>
        new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime(),
    );
}

/** Upcoming events across the platform, soonest first (P3-6). */
export async function listUpcomingEvents(client) {
  const catalog = await getCatalog(client);
  const cutoff = Date.now() - 4 * 3_600_000;
  const horizon = Date.now() + 15 * 24 * 3_600_000;
  return catalog.events
    .filter((e) => {
      const startsAt = new Date(e.starts_at).getTime();
      return startsAt > cutoff && startsAt <= horizon;
    })
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
    .map((e) => {
      const restaurant = catalog.restaurants.find(
        (r) => r.id === e.restaurant_id,
      );
      return {
        ...e,
        restaurantName: restaurant?.name ?? '',
        restaurantAddress:
          restaurant?.address || restaurant?.area || 'Warangal',
        restaurantLat: restaurant?.lat ?? null,
        restaurantLng: restaurant?.lng ?? null,
      };
    });
}

/** Public aggregate only; individual student interest remains protected by RLS. */
export async function listEventInterestCounts(client) {
  if (!isSupabaseConfigured()) {
    const fallbackCounts = [42, 28, 19, 16, 37, 31];
    return new Map(
      seedEvents.map((event, index) => [event.id, fallbackCounts[index] ?? 0]),
    );
  }

  const { data } = await client
    .from('event_interest_counts')
    .select('event_id, interest_count');
  return new Map(
    (data ?? [])
      .filter((row) => row.event_id)
      .map((row) => [row.event_id, row.interest_count ?? 0]),
  );
}

export async function getEventDetail(client, id) {
  const catalog = await getCatalog(client);
  const event = catalog.events.find((item) => item.id === id);
  if (!event || event.is_cancelled) return null;
  const restaurant = catalog.restaurants.find(
    (item) => item.id === event.restaurant_id,
  );
  if (!restaurant) return null;
  const moreEvents = catalog.events
    .filter(
      (item) =>
        item.id !== id &&
        item.restaurant_id === restaurant.id &&
        !item.is_cancelled &&
        new Date(item.starts_at).getTime() > Date.now() - 4 * 3_600_000,
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
    .slice(0, 3);

  return { event, restaurant, moreEvents };
}

/** Minimal client-safe index for the homepage's instant search suggestions. */
export async function listQuickSearchIndex(client) {
  const catalog = await getCatalog(client);
  const restaurantsById = new Map(
    catalog.restaurants.map((restaurant) => [restaurant.id, restaurant]),
  );

  return {
    restaurants: catalog.restaurants
      .map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        area: restaurant.area,
        trendingViews: catalog.trendingViews.get(restaurant.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.trendingViews - a.trendingViews || a.name.localeCompare(b.name),
      ),
    dishes: catalog.menuItems
      .filter((item) => item.is_available)
      .flatMap((item) => {
        const restaurant = restaurantsById.get(item.restaurant_id);
        return restaurant
          ? [
              {
                id: item.id,
                name: item.name,
                price: item.price,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
              },
            ]
          : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Dish-level search: menu items whose name matches, with prices (P3-5). */
export async function searchDishes(client, q) {
  if (!q || !q.trim()) return [];
  const catalog = await getCatalog(client);
  const needle = q.trim().toLowerCase();
  const summaries = new Map();
  const hits = [];
  for (const item of catalog.menuItems) {
    if (!item.name.toLowerCase().includes(needle)) continue;
    const row = catalog.restaurants.find((r) => r.id === item.restaurant_id);
    if (!row) continue;
    if (!summaries.has(row.id)) summaries.set(row.id, toSummary(row, catalog));
    hits.push({ item, restaurant: summaries.get(row.id) });
  }
  return hits.sort((a, b) => a.item.price - b.item.price);
}

/** "You may also like": three sharing area or craving tags (P3-12). */
export async function alsoLike(client, id) {
  const catalog = await getCatalog(client);
  const self = catalog.restaurants.find((r) => r.id === id);
  if (!self) return [];
  const selfSummary = toSummary(self, catalog);
  return catalog.restaurants
    .filter((r) => r.id !== id)
    .map((r) => toSummary(r, catalog))
    .map((s) => ({
      s,
      score:
        (s.area === selfSummary.area ? 2 : 0) +
        s.cravingTags.filter((t) => selfSummary.cravingTags.includes(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ s }) => s);
}
