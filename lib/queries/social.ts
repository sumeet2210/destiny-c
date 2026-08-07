// Social reads (rule 0.1). Everything here is scoped by RLS: what comes back
// for another student is already consent-filtered (friend + sharing on).
import 'server-only';
import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';

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

export const getFriendsBundle = cache(async (): Promise<FriendsBundle> => {
  const empty: FriendsBundle = { friends: [], incoming: [], outgoing: [] };
  if (!isSupabaseConfigured()) return empty;
  const me = await getSessionUser();
  if (!me || me.role !== 'student') return empty;

  const supabase = await createClient();
  const { data: rows } = await supabase.from('friendships').select('*');
  if (!rows || rows.length === 0) return empty;

  const otherIds = [
    ...new Set(
      rows.map((f) =>
        f.requester_id === me.id ? f.addressee_id : f.requester_id,
      ),
    ),
  ];
  const { data: people } = await supabase
    .from('users')
    .select('id, full_name, hostel')
    .in('id', otherIds);
  const byId = new Map((people ?? []).map((p) => [p.id, p]));

  const entry = (f: (typeof rows)[number]): FriendEntry => {
    const otherId = f.requester_id === me.id ? f.addressee_id : f.requester_id;
    return {
      friendshipId: f.id,
      userId: otherId,
      name: byId.get(otherId)?.full_name ?? null,
      hostel: byId.get(otherId)?.hostel ?? null,
    };
  };

  return {
    friends: rows.filter((f) => f.status === 'accepted').map(entry),
    incoming: rows
      .filter((f) => f.status === 'pending' && f.addressee_id === me.id)
      .map(entry),
    outgoing: rows
      .filter((f) => f.status === 'pending' && f.requester_id === me.id)
      .map(entry),
  };
});

/** Restaurant ids the current student has saved. */
export const getSavedIds = cache(async (): Promise<Set<string>> => {
  if (!isSupabaseConfigured()) return new Set();
  const me = await getSessionUser();
  if (!me || me.role !== 'student') return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from('saved_restaurants')
    .select('restaurant_id')
    .eq('student_id', me.id);
  return new Set((data ?? []).map((r) => r.restaurant_id));
});

export type FriendActivity = {
  /** restaurant_id → names of friends who saved it (sharing on only). */
  savedBy: Map<string, string[]>;
  /** event_id → names of friends going (sharing on only). */
  goingTo: Map<string, string[]>;
};

/**
 * P9-5 / P9-6: what accepted, sharing-on friends have saved and RSVP'd.
 * RLS does the consent filtering — this just asks.
 */
export const getFriendActivity = cache(async (): Promise<FriendActivity> => {
  const empty: FriendActivity = { savedBy: new Map(), goingTo: new Map() };
  if (!isSupabaseConfigured()) return empty;
  const me = await getSessionUser();
  if (!me || me.role !== 'student') return empty;
  const { friends } = await getFriendsBundle();
  if (friends.length === 0) return empty;

  const supabase = await createClient();
  const friendIds = friends.map((f) => f.userId);
  const nameOf = new Map(friends.map((f) => [f.userId, f.name ?? 'A friend']));

  const [saved, rsvps] = await Promise.all([
    supabase
      .from('saved_restaurants')
      .select('restaurant_id, student_id')
      .in('student_id', friendIds),
    supabase
      .from('event_rsvps')
      .select('event_id, student_id')
      .in('student_id', friendIds),
  ]);

  const savedBy = new Map<string, string[]>();
  for (const row of saved.data ?? []) {
    const list = savedBy.get(row.restaurant_id) ?? [];
    list.push(nameOf.get(row.student_id) ?? 'A friend');
    savedBy.set(row.restaurant_id, list);
  }
  const goingTo = new Map<string, string[]>();
  for (const row of rsvps.data ?? []) {
    const list = goingTo.get(row.event_id) ?? [];
    list.push(nameOf.get(row.student_id) ?? 'A friend');
    goingTo.set(row.event_id, list);
  }
  return { savedBy, goingTo };
});

/** Event ids the current student has RSVP'd to. */
export const getMyRsvpIds = cache(async (): Promise<Set<string>> => {
  if (!isSupabaseConfigured()) return new Set();
  const me = await getSessionUser();
  if (!me || me.role !== 'student') return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('student_id', me.id);
  return new Set((data ?? []).map((r) => r.event_id));
});
