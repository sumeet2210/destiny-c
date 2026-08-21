// The public read layer (rule 0.1: no component talks to Supabase directly).
//
// Data source: Supabase when configured, the typed seed otherwise
// (docs/decisions.md 2026-08-07). Either way the raw rows are normalized here
// and filtered/sorted by the same pure helpers, so both modes behave
// identically. In-memory filtering is deliberate at pilot scale — the whole
// active catalog is a few dozen rows during testing.

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { PRICE_BUCKETS } from '@/config/price-buckets';
import type { Database, Tables } from '@/types/db';
import {
  seedEvents,
  seedMenuItems,
  seedOffers,
  seedPhotos,
  seedRestaurants,
  seedReviews,
} from '@/lib/data/seed';
import {
  isOpenToday,
  isOpenAt,
  minutesUntilClose,
  type OpeningHours,
} from '@/lib/domain/hours';

export type Catalog = {
  restaurants: Tables<'restaurants'>[];
  menuItems: Tables<'menu_items'>[];
  offers: Tables<'offers'>[];
  photos: Tables<'restaurant_photos'>[];
  events: Tables<'events'>[];
  reviews: Tables<'reviews'>[];
  trendingViews: Map<string, number>;
};

const isConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

async function publicClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
}

/** One catalog fetch per request, shared by every page section (React.cache). */
export const getCatalog = cache(async (): Promise<Catalog> => {
  if (!isConfigured()) {
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

  const supabase = await publicClient();
  const [restaurants, menuItems, offers, photos, events, reviews, trending] =
    await Promise.all([
      supabase.from('restaurants').select('*').eq('status', 'active'),
      supabase.from('menu_items').select('*'),
      supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()),
      supabase.from('restaurant_photos').select('*').order('sort_order'),
      supabase.from('events').select('*').eq('is_cancelled', false),
      supabase.from('reviews').select('*'),
      supabase.rpc('trending_restaurants'),
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
});

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export type RestaurantSummary = {
  id: string;
  name: string;
  area: string;
  lat: number | null;
  lng: number | null;
  price_per_head: number | null;
  is_veg_only: boolean;
  has_ac: boolean;
  dine_in: boolean;
  takeaway: boolean;
  student_discount: boolean;
  vibe_tags: string[];
  photos: string[];
  cravingTags: string[];
  isOpen: boolean;
  isOpenToday: boolean;
  closingInMinutes: number | null;
  rating: number | null;
  reviewCount: number;
  trendingViews: number;
  liveOffer: {
    title: string;
    discount_text: string | null;
    expires_at: string;
  } | null;
  upcomingEvent: {
    title: string;
    starts_at: string;
    event_type: Tables<'events'>['event_type'];
  } | null;
};

export function toSummary(
  r: Tables<'restaurants'>,
  catalog: Catalog,
  at: Date = new Date(),
): RestaurantSummary {
  const hours = r.opening_hours as OpeningHours | null;
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

export async function listRestaurantSummaries(): Promise<RestaurantSummary[]> {
  const catalog = await getCatalog();
  return catalog.restaurants.map((r) => toSummary(r, catalog));
}

// ---------------------------------------------------------------------------
// Filters — one implementation for both data sources (PRD §5.3)
// ---------------------------------------------------------------------------

export type CatalogFilters = {
  craving?: string;
  veg?: 'veg' | 'nonveg';
  openNow?: boolean;
  hasOffer?: boolean;
  price?: string; // price bucket key
  area?: string;
  vibe?: string;
  discount?: boolean;
  ac?: 'ac' | 'nonac';
  service?: 'dinein' | 'takeaway';
  minRating?: number;
  q?: string;
  sort?: 'trending' | 'price_asc' | 'rating' | 'nearest';
};

export function applyFilters(
  list: RestaurantSummary[],
  f: CatalogFilters,
): RestaurantSummary[] {
  let out = list;
  if (f.craving) out = out.filter((r) => r.cravingTags.includes(f.craving!));
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
  if (f.vibe) out = out.filter((r) => r.vibe_tags.includes(f.vibe!));
  if (f.discount) out = out.filter((r) => r.student_discount);
  if (f.ac === 'ac') out = out.filter((r) => r.has_ac);
  if (f.ac === 'nonac') out = out.filter((r) => !r.has_ac);
  if (f.service === 'dinein') out = out.filter((r) => r.dine_in);
  if (f.service === 'takeaway') out = out.filter((r) => r.takeaway);
  if (f.minRating)
    out = out.filter((r) => r.rating !== null && r.rating >= f.minRating!);
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

// ---------------------------------------------------------------------------
// Entity readers
// ---------------------------------------------------------------------------

export type RestaurantDetail = {
  summary: RestaurantSummary;
  row: Tables<'restaurants'>;
  menu: Tables<'menu_items'>[];
  menuPhotos: string[];
  offers: Tables<'offers'>[];
  events: (Tables<'events'> & { restaurantName: string })[];
  reviews: Tables<'reviews'>[];
};

export async function getRestaurantDetail(
  id: string,
): Promise<RestaurantDetail | null> {
  const catalog = await getCatalog();
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
export async function listTickerOffers() {
  const catalog = await getCatalog();
  return catalog.offers
    .map((o) => {
      const restaurant = catalog.restaurants.find(
        (r) => r.id === o.restaurant_id,
      );
      return {
        ...o,
        restaurantName: restaurant?.name ?? '',
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
export async function listUpcomingEvents() {
  const catalog = await getCatalog();
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
        restaurantLat: restaurant?.lat ?? null,
        restaurantLng: restaurant?.lng ?? null,
      };
    });
}

/** Public aggregate only; individual student interest remains protected by RLS. */
export async function listEventInterestCounts(): Promise<Map<string, number>> {
  if (!isConfigured()) {
    const fallbackCounts = [42, 28, 19, 16, 37, 31];
    return new Map(
      seedEvents.map((event, index) => [event.id, fallbackCounts[index] ?? 0]),
    );
  }

  const supabase = await publicClient();
  const { data } = await supabase
    .from('event_interest_counts')
    .select('event_id, interest_count');
  return new Map(
    (data ?? [])
      .filter((row) => row.event_id)
      .map((row) => [row.event_id!, row.interest_count ?? 0]),
  );
}

export async function getEventDetail(id: string) {
  const catalog = await getCatalog();
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

export type DishHit = {
  item: Tables<'menu_items'>;
  restaurant: RestaurantSummary;
};

export type QuickSearchIndex = {
  restaurants: Array<{
    id: string;
    name: string;
    area: string;
    trendingViews: number;
  }>;
  dishes: Array<{
    id: string;
    name: string;
    price: number;
    restaurantId: string;
    restaurantName: string;
  }>;
};

/** Minimal client-safe index for the homepage's instant search suggestions. */
export async function listQuickSearchIndex(): Promise<QuickSearchIndex> {
  const catalog = await getCatalog();
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
export async function searchDishes(q: string): Promise<DishHit[]> {
  if (!q.trim()) return [];
  const catalog = await getCatalog();
  const needle = q.trim().toLowerCase();
  const summaries = new Map<string, RestaurantSummary>();
  const hits: DishHit[] = [];
  for (const item of catalog.menuItems) {
    if (!item.name.toLowerCase().includes(needle)) continue;
    const row = catalog.restaurants.find((r) => r.id === item.restaurant_id);
    if (!row) continue;
    if (!summaries.has(row.id)) summaries.set(row.id, toSummary(row, catalog));
    hits.push({ item, restaurant: summaries.get(row.id)! });
  }
  return hits.sort((a, b) => a.item.price - b.item.price);
}

/** "You may also like": three sharing area or craving tags (P3-12). */
export async function alsoLike(id: string): Promise<RestaurantSummary[]> {
  const catalog = await getCatalog();
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
