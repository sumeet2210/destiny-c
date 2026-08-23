// Shared view-model types for the API boundary.
//
// These mirror the JSON the Express backend returns (backend/src/lib/view/*),
// which was itself ported from the old lib/queries/*. They live here — not in
// lib/queries — because that directory is removed once the rewire completes. The
// generated row types in @/types/db stay, so we still build on Tables<...>.
import type { Tables } from '@/types/db';

// --- Catalog ----------------------------------------------------------------

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

export type RestaurantDetail = {
  summary: RestaurantSummary;
  row: Tables<'restaurants'>;
  menu: Tables<'menu_items'>[];
  menuPhotos: string[];
  offers: Tables<'offers'>[];
  events: (Tables<'events'> & { restaurantName: string })[];
  reviews: Tables<'reviews'>[];
};

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

/** A row decorated with its restaurant's public location, used by tickers/maps. */
type WithRestaurantLocation = {
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number | null;
  restaurantLng: number | null;
};

export type TickerOffer = Tables<'offers'> & WithRestaurantLocation;
export type UpcomingEvent = Tables<'events'> & WithRestaurantLocation;

export type EventDetail = {
  event: Tables<'events'>;
  restaurant: Tables<'restaurants'>;
  moreEvents: Tables<'events'>[];
};

// --- Bookings ---------------------------------------------------------------

export type StudentBooking = Tables<'bookings'> & {
  restaurantName: string;
  offerTitle: string | null;
  eventTitle: string | null;
  alreadyReviewed?: boolean;
};

// --- Owner ------------------------------------------------------------------

export type OwnerBundle = {
  restaurant: Tables<'restaurants'>;
  menu: Tables<'menu_items'>[];
  offers: Tables<'offers'>[];
  events: Tables<'events'>[];
  photos: Tables<'restaurant_photos'>[];
};

export type OwnerBooking = Tables<'bookings'> & {
  studentName: string | null;
  studentNoShows: number;
  offerTitle: string | null;
  eventTitle: string | null;
};

export type AnalyticsBundle = {
  totals: { last7: number; last30: number };
  byDay: { day: string; views: number }[];
  bySource: { source_filter: string; views: number }[];
};

// --- Social -----------------------------------------------------------------

export type FriendEntry = {
  friendshipId: string;
  userId: string;
  name: string | null;
  hostel: string | null;
};

export type FriendsBundle = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
};

/** Reconstructed client-side (the backend sends objects, we restore Maps to
 *  match what the old query returned). */
export type FriendActivity = {
  savedBy: Map<string, string[]>;
  goingTo: Map<string, string[]>;
};

// --- Admin ------------------------------------------------------------------

export type AdminOverview = {
  users: { student: number; owner: number; admin: number; total: number };
  restaurants: {
    pending_approval: number;
    active: number;
    suspended: number;
    total: number;
  };
  bookings: {
    requested: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  moderation: {
    offers_live: number;
    offers_flagged: number;
    events: number;
    reviews: number;
  };
};

export type AdminRestaurant = {
  id: string;
  name: string;
  area: string;
  address: string | null;
  phone: string | null;
  status: Tables<'restaurants'>['status'];
  owner_id: string;
  cover_image_url: string | null;
  created_at: string;
  owner: { id: string; full_name: string | null; email: string } | null;
};

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: Tables<'users'>['role'];
  hostel: string | null;
  nitw_verified: boolean;
  no_show_count: number;
  created_at: string;
};

export type FlaggedOffer = {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  discount_text: string | null;
  is_active: boolean;
  flagged_count: number;
  starts_at: string;
  expires_at: string;
  created_at: string;
  restaurantName: string | null;
};

export type AdminReview = {
  id: string;
  restaurant_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurantName: string | null;
  student: { id: string; full_name: string | null; email: string } | null;
};
