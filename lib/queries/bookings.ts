// Student-side booking reads (rule 0.1).
import 'server-only';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Tables } from '@/types/db';

export type StudentBooking = Tables<'bookings'> & {
  restaurantName: string;
  alreadyReviewed?: boolean;
};

export async function listStudentBookings(): Promise<StudentBooking[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_id', user.id)
    .order('booking_time', { ascending: false });
  if (!bookings || bookings.length === 0) return [];

  const restaurantIds = [...new Set(bookings.map((b) => b.restaurant_id))];
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name')
    .in('id', restaurantIds);
  const names = new Map((restaurants ?? []).map((r) => [r.id, r.name]));

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('booking_id')
    .eq('student_id', user.id);
  const reviewed = new Set((myReviews ?? []).map((r) => r.booking_id));

  return bookings.map((b) => ({
    ...b,
    restaurantName: names.get(b.restaurant_id) ?? 'A restaurant',
    alreadyReviewed: reviewed.has(b.id),
  }));
}

export async function getStudentBooking(
  id: string,
): Promise<StudentBooking | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: b } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!b) return null;
  const { data: r } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', b.restaurant_id)
    .maybeSingle();
  return { ...b, restaurantName: r?.name ?? 'A restaurant' };
}
