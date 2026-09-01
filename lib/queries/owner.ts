// Owner-side reads (rule 0.1). All rows come back under the owner's own RLS.
import 'server-only';
import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  buildOwnerAnalyticsSummary,
  type OwnerAnalyticsSummary,
} from '@/lib/domain/owner-analytics';
import { averageRating } from '@/lib/domain/reviews';
import type { Tables } from '@/types/db';

export type OwnerBundle = {
  restaurant: Tables<'restaurants'>;
  menu: Tables<'menu_items'>[];
  offers: Tables<'offers'>[];
  events: Tables<'events'>[];
  photos: Tables<'restaurant_photos'>[];
};

/** Everything the dashboard needs, one round of parallel queries per request. */
export const getOwnerBundle = cache(async (): Promise<OwnerBundle | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!restaurant) return null;

  const [menu, offers, events, photos] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('name'),
    supabase
      .from('offers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('expires_at', { ascending: false }),
    supabase
      .from('events')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('starts_at', { ascending: false }),
    supabase
      .from('restaurant_photos')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('sort_order'),
  ]);

  return {
    restaurant,
    menu: menu.data ?? [],
    offers: offers.data ?? [],
    events: events.data ?? [],
    photos: photos.data ?? [],
  };
});

/** Empty and populated owner-created gallery folders, in display order. */
export async function getOwnerGalleryFolders(): Promise<
  Tables<'restaurant_gallery_folders'>[]
> {
  if (!isSupabaseConfigured()) return [];
  const bundle = await getOwnerBundle();
  if (!bundle) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurant_gallery_folders')
    .select('*')
    .eq('restaurant_id', bundle.restaurant.id)
    .order('sort_order')
    .order('created_at');
  return data ?? [];
}

/** Owner-created menu groupings, including empty groups. */
export async function getOwnerMenuSections(): Promise<
  Tables<'menu_sections'>[]
> {
  if (!isSupabaseConfigured()) return [];
  const bundle = await getOwnerBundle();
  if (!bundle) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('menu_sections')
    .select('*')
    .eq('restaurant_id', bundle.restaurant.id)
    .order('sort_order')
    .order('created_at');
  return data ?? [];
}

export type OwnerBooking = Tables<'bookings'> & {
  studentName: string | null;
  studentNoShows: number;
  offerTitle: string | null;
  eventTitle: string | null;
};

export async function listOwnerBookings(): Promise<OwnerBooking[]> {
  if (!isSupabaseConfigured()) return [];
  const bundle = await getOwnerBundle();
  if (!bundle) return [];
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('restaurant_id', bundle.restaurant.id)
    .order('booking_time', { ascending: false });
  if (!bookings || bookings.length === 0) return [];

  const studentIds = [...new Set(bookings.map((b) => b.student_id))];
  const { data: students } = await supabase
    .from('users')
    .select('id, full_name, no_show_count')
    .in('id', studentIds);
  const byId = new Map((students ?? []).map((s) => [s.id, s]));

  const offerIds = bookings.flatMap((booking) =>
    booking.offer_id ? [booking.offer_id] : [],
  );
  const eventIds = bookings.flatMap((booking) =>
    booking.event_id ? [booking.event_id] : [],
  );
  const [offersResult, eventsResult] = await Promise.all([
    offerIds.length
      ? supabase
          .from('offers')
          .select('id, title, discount_text')
          .in('id', offerIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from('events').select('id, title').in('id', eventIds)
      : Promise.resolve({ data: [] }),
  ]);
  const offerNames = new Map(
    (offersResult.data ?? []).map((offer) => [
      offer.id,
      offer.discount_text || offer.title,
    ]),
  );
  const eventNames = new Map(
    (eventsResult.data ?? []).map((event) => [event.id, event.title]),
  );

  return bookings.map((b) => ({
    ...b,
    studentName: byId.get(b.student_id)?.full_name ?? null,
    studentNoShows: byId.get(b.student_id)?.no_show_count ?? 0,
    offerTitle: b.offer_id ? (offerNames.get(b.offer_id) ?? null) : null,
    eventTitle: b.event_id ? (eventNames.get(b.event_id) ?? null) : null,
  }));
}

export type OwnerReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type OwnerReviewSummary = {
  reviews: OwnerReview[];
  average: number | null;
  count: number;
};

/**
 * Reviews left on the owner's own restaurant.
 *
 * student_id is deliberately not selected. Main shows reviewers anonymously on
 * the public page, and an owner has no more claim on a diner's identity than a
 * passer-by does — so the name never enters this query, let alone the UI.
 *
 * Scoped twice over: the restaurant came from owner_id = auth.uid(), and the
 * reviews RLS policy independently gates on owns_restaurant(restaurant_id).
 * The owner's own session client, never the service key.
 */
export const getOwnerReviews = cache(
  async (): Promise<OwnerReviewSummary | null> => {
    if (!isSupabaseConfigured()) return null;
    const bundle = await getOwnerBundle();
    if (!bundle) return null;
    const supabase = await createClient();

    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('restaurant_id', bundle.restaurant.id)
      .order('created_at', { ascending: false });

    const reviews = data ?? [];
    return {
      reviews,
      average: averageRating(reviews.map((review) => review.rating)),
      count: reviews.length,
    };
  },
);

export type AnalyticsBundle = OwnerAnalyticsSummary;

export async function getOwnerAnalytics(): Promise<AnalyticsBundle | null> {
  if (!isSupabaseConfigured()) return null;
  const bundle = await getOwnerBundle();
  if (!bundle) return null;
  const supabase = await createClient();

  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [views, bookings, savedCount] = await Promise.all([
    supabase
      .from('profile_views')
      .select('created_at, source_filter')
      .eq('restaurant_id', bundle.restaurant.id)
      .gte('created_at', cutoff),
    supabase
      .from('bookings')
      .select('student_id, created_at, offer_id, status')
      .eq('restaurant_id', bundle.restaurant.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('owner_saved_restaurant_count', {
      target_restaurant_id: bundle.restaurant.id,
    }),
  ]);

  if (views.error || bookings.error || savedCount.error) return null;

  return buildOwnerAnalyticsSummary({
    views: views.data ?? [],
    bookings: bookings.data ?? [],
    saved: Number(savedCount.data ?? 0),
  });
}
