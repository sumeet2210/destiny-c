// Student-side review reads (rule 0.1). Owner-side reviews live in owner.ts,
// public ones come off the catalog — this module answers only "what have I
// written", which is the one view neither of those can serve: RLS lets a student
// read their own rows, and nobody else's.
import 'server-only';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type StudentReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurantId: string;
  restaurantName: string;
};

export async function listStudentReviews(): Promise<StudentReview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, restaurant_id')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });
  if (!reviews || reviews.length === 0) return [];

  // Two queries rather than an embed, matching listStudentBookings. Either way
  // the restaurants read policy applies, so a review of a place that has since
  // been suspended resolves to the fallback name below instead of vanishing —
  // the student wrote it, so they keep seeing it.
  const restaurantIds = [...new Set(reviews.map((r) => r.restaurant_id))];
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds);
  const names = new Map((restaurants ?? []).map((r) => [r.id, r.name]));

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    restaurantId: review.restaurant_id,
    restaurantName: names.get(review.restaurant_id) ?? 'A restaurant',
  }));
}
