import 'server-only';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type StudentReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
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
  if (!reviews?.length) return [];

  const restaurantIds = [
    ...new Set(reviews.map((review) => review.restaurant_id)),
  ];
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds);
  const restaurantNames = new Map(
    (restaurants ?? []).map((restaurant) => [restaurant.id, restaurant.name]),
  );

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    restaurantName: restaurantNames.get(review.restaurant_id) ?? 'A restaurant',
  }));
}
