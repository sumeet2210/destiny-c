// Admin console reads. Ported from backend-branch's admin.controller.js into
// main's Server Component query layer (rule 0.1: reads live in lib/queries).
//
// SECURITY: every function here runs on the service-role client, which bypasses
// RLS. The schema has no admin policies by design, so there is no second line of
// defence — requireAdmin() at the top of each function IS the security boundary.
// Never export a helper from this file that skips it, and never import this file
// from anything that could reach a client bundle.
import 'server-only';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import type { Enums, Tables } from '@/types/db';

export type RestaurantStatus = Enums<'restaurant_status'>;
export type UserRole = Enums<'user_role'>;

/** The service key is only present on a configured project; in seed mode the
 *  console renders a not-configured notice instead of throwing. */
function unavailable(): boolean {
  return !isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY;
}

export type BookingStatus = Enums<'booking_status'>;

export type AdminOverview = {
  users: Record<UserRole | 'total', number>;
  restaurants: Record<RestaurantStatus | 'total', number>;
  bookings: Record<BookingStatus, number>;
  moderation: Record<
    'offers_live' | 'offers_flagged' | 'events' | 'reviews',
    number
  >;
};

/** Unwrap a `head: true` count query. `count` is null only on error. */
async function n(
  q: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  await requireAdmin();
  if (unavailable()) return null;
  const db = createAdminClient();

  // head: true keeps every one of these to a COUNT — the console never pulls the
  // rows. NOTE: main's booking_status enum has five values, including
  // `unconfirmed`, which backend-branch's overview omitted; all five are counted
  // here so the totals actually add up to the bookings table.
  const users = (role: UserRole) =>
    n(
      db
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', role),
    );
  const restaurants = (status: RestaurantStatus) =>
    n(
      db
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .eq('status', status),
    );
  const bookings = (status: BookingStatus) =>
    n(
      db
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', status),
    );

  const [
    student,
    owner,
    admin,
    pending_approval,
    active,
    suspended,
    requested,
    confirmed,
    unconfirmed,
    completed,
    cancelled,
    offers_live,
    offers_flagged,
    events,
    reviews,
  ] = await Promise.all([
    users('student'),
    users('owner'),
    users('admin'),
    restaurants('pending_approval'),
    restaurants('active'),
    restaurants('suspended'),
    bookings('requested'),
    bookings('confirmed'),
    bookings('unconfirmed'),
    bookings('completed'),
    bookings('cancelled'),
    n(
      db
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ),
    n(
      db
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .gt('flagged_count', 0),
    ),
    n(db.from('events').select('id', { count: 'exact', head: true })),
    n(db.from('reviews').select('id', { count: 'exact', head: true })),
  ]);

  return {
    users: { student, owner, admin, total: student + owner + admin },
    restaurants: {
      pending_approval,
      active,
      suspended,
      total: pending_approval + active + suspended,
    },
    bookings: { requested, confirmed, unconfirmed, completed, cancelled },
    moderation: { offers_live, offers_flagged, events, reviews },
  };
}

export type AdminRestaurant = Pick<
  Tables<'restaurants'>,
  | 'id'
  | 'name'
  | 'area'
  | 'address'
  | 'phone'
  | 'status'
  | 'owner_id'
  | 'cover_image_url'
  | 'created_at'
> & {
  owner: Pick<Tables<'users'>, 'id' | 'full_name' | 'email'> | null;
};

export async function listAdminRestaurants(
  status?: RestaurantStatus,
): Promise<AdminRestaurant[]> {
  await requireAdmin();
  if (unavailable()) return [];
  const db = createAdminClient();

  let query = db
    .from('restaurants')
    .select(
      'id, name, area, address, phone, status, owner_id, cover_image_url, created_at',
    )
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Decorate with the owner's name/email. A separate lookup rather than a join:
  // the FK points at users, and PostgREST embedding would need a policy the
  // service client doesn't consult anyway.
  const ownerIds = [...new Set((data ?? []).map((r) => r.owner_id))];
  const owners = new Map<
    string,
    Pick<Tables<'users'>, 'id' | 'full_name' | 'email'>
  >();
  if (ownerIds.length) {
    const { data: users } = await db
      .from('users')
      .select('id, full_name, email')
      .in('id', ownerIds);
    for (const u of users ?? []) owners.set(u.id, u);
  }

  return (data ?? []).map((r) => ({
    ...r,
    owner: owners.get(r.owner_id) ?? null,
  }));
}

export type AdminUser = Pick<
  Tables<'users'>,
  | 'id'
  | 'full_name'
  | 'email'
  | 'role'
  | 'hostel'
  | 'nitw_verified'
  | 'no_show_count'
  | 'created_at'
>;

/** Strip the characters that carry meaning inside a PostgREST `or()` filter
 *  before interpolating a user-supplied search term. */
function safeLike(input: string | undefined): string {
  return String(input ?? '')
    .replace(/[,()%*:]/g, '')
    .trim()
    .slice(0, 64);
}

export async function listAdminUsers(opts?: {
  role?: UserRole;
  q?: string;
}): Promise<AdminUser[]> {
  await requireAdmin();
  if (unavailable()) return [];
  const db = createAdminClient();

  let query = db
    .from('users')
    .select(
      'id, full_name, email, role, hostel, nitw_verified, no_show_count, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (opts?.role) query = query.eq('role', opts.role);
  const search = safeLike(opts?.q);
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type AdminFlaggedOffer = Pick<
  Tables<'offers'>,
  | 'id'
  | 'restaurant_id'
  | 'title'
  | 'description'
  | 'discount_text'
  | 'is_active'
  | 'flagged_count'
  | 'starts_at'
  | 'expires_at'
  | 'created_at'
> & { restaurantName: string | null };

export async function listFlaggedOffers(): Promise<AdminFlaggedOffer[]> {
  await requireAdmin();
  if (unavailable()) return [];
  const db = createAdminClient();

  const { data, error } = await db
    .from('offers')
    .select(
      'id, restaurant_id, title, description, discount_text, is_active, flagged_count, starts_at, expires_at, created_at',
    )
    .gt('flagged_count', 0)
    .order('flagged_count', { ascending: false });
  if (error) throw new Error(error.message);

  const restaurantIds = [...new Set((data ?? []).map((o) => o.restaurant_id))];
  const names = new Map<string, string>();
  if (restaurantIds.length) {
    const { data: rows } = await db
      .from('restaurants')
      .select('id, name')
      .in('id', restaurantIds);
    for (const r of rows ?? []) names.set(r.id, r.name);
  }

  return (data ?? []).map((o) => ({
    ...o,
    restaurantName: names.get(o.restaurant_id) ?? null,
  }));
}

export type AdminReview = Pick<
  Tables<'reviews'>,
  'id' | 'restaurant_id' | 'student_id' | 'rating' | 'comment' | 'created_at'
> & {
  restaurantName: string | null;
  student: Pick<Tables<'users'>, 'id' | 'full_name' | 'email'> | null;
};

export async function listAdminReviews(
  restaurantId?: string,
): Promise<AdminReview[]> {
  await requireAdmin();
  if (unavailable()) return [];
  const db = createAdminClient();

  let query = db
    .from('reviews')
    .select('id, restaurant_id, student_id, rating, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (restaurantId) query = query.eq('restaurant_id', restaurantId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const restaurantIds = [...new Set((data ?? []).map((r) => r.restaurant_id))];
  const studentIds = [...new Set((data ?? []).map((r) => r.student_id))];
  const [restaurants, students] = await Promise.all([
    restaurantIds.length
      ? db.from('restaurants').select('id, name').in('id', restaurantIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    studentIds.length
      ? db.from('users').select('id, full_name, email').in('id', studentIds)
      : Promise.resolve({
          data: [] as Pick<Tables<'users'>, 'id' | 'full_name' | 'email'>[],
        }),
  ]);
  const rMap = new Map((restaurants.data ?? []).map((r) => [r.id, r.name]));
  const sMap = new Map((students.data ?? []).map((u) => [u.id, u]));

  return (data ?? []).map((r) => ({
    ...r,
    restaurantName: rMap.get(r.restaurant_id) ?? null,
    student: sMap.get(r.student_id) ?? null,
  }));
}
