// Temporary Phase-2 smoke test — deleted after running.
import { createApp } from './src/app.js';
import {
  listRestaurantSummaries,
  getRestaurantDetail,
  applyFilters,
  searchDishes,
  listUpcomingEvents,
  listTickerOffers,
  listQuickSearchIndex,
  listEventInterestCounts,
  alsoLike,
} from './src/lib/view/summary.js';
import { isSupabaseConfigured } from './src/config/index.js';

console.log('supabase configured?', isSupabaseConfigured());

const app = createApp();
console.log('app created:', typeof app === 'function');

const summaries = await listRestaurantSummaries(null);
console.log('summaries:', summaries.length, summaries.map((s) => s.name));
console.log(
  'first summary shape:',
  JSON.stringify(
    {
      name: summaries[0].name,
      isOpen: summaries[0].isOpen,
      isOpenToday: summaries[0].isOpenToday,
      rating: summaries[0].rating,
      reviewCount: summaries[0].reviewCount,
      cravingTags: summaries[0].cravingTags,
      photos: summaries[0].photos,
      liveOffer: summaries[0].liveOffer,
      trendingViews: summaries[0].trendingViews,
    },
    null,
    0,
  ),
);

const detail = await getRestaurantDetail(
  null,
  '00000000-0000-4000-8000-000000000001',
);
console.log(
  'detail:',
  'menu',
  detail?.menu.length,
  'offers',
  detail?.offers.length,
  'reviews',
  detail?.reviews.length,
  'menuPhotos',
  detail?.menuPhotos.length,
);

const dishes = await searchDishes(null, 'biryani');
console.log('dishes for "biryani":', dishes.map((d) => d.item.name));

const events = await listUpcomingEvents(null);
console.log('upcoming events:', events.length, events.map((e) => e.title));

const ticker = await listTickerOffers(null);
console.log('ticker offers:', ticker.length);

const idx = await listQuickSearchIndex(null);
console.log('quick index: restaurants', idx.restaurants.length, 'dishes', idx.dishes.length);

const counts = await listEventInterestCounts(null);
console.log('interest counts entries:', counts.size);

const like = await alsoLike(null, '00000000-0000-4000-8000-000000000001');
console.log('also-like:', like.map((s) => s.name));

const vegCheap = applyFilters(summaries, { veg: 'veg', sort: 'price_asc' });
console.log('veg + price_asc:', vegCheap.map((s) => `${s.name}:${s.price_per_head}`));

const openNow = applyFilters(summaries, { openNow: true });
console.log('openNow count:', openNow.length);

console.log('SMOKE OK');
