'use server';

// Phase 9: saved, friends, RSVPs. Friendships go through friend_edges /
// canonical-pair constraints in the DB; RLS enforces the two-key consent rule.

import { revalidatePath } from 'next/cache';
import { SOCIAL } from '@/config/social';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ActionResult = { ok: boolean; message?: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: 'This needs a live Supabase project.',
};

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Saved (P9-1)
// ---------------------------------------------------------------------------

export async function toggleSaved(
  restaurantId: string,
): Promise<ActionResult & { saved?: boolean }> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: 'Log in to save places.' };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('saved_restaurants')
    .select('id')
    .eq('student_id', uid)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('saved_restaurants')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/saved');
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from('saved_restaurants')
    .insert({ student_id: uid, restaurant_id: restaurantId });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/saved');
  return { ok: true, saved: true };
}

// ---------------------------------------------------------------------------
// Friends (P9-2)
// ---------------------------------------------------------------------------

export async function sendFriendRequest(email: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: 'Log in first.' };
  const supabase = await createClient();

  const { data: matches, error: findError } = await supabase.rpc(
    'find_student_by_email',
    { lookup_email: email.trim() },
  );
  if (findError) return { ok: false, message: findError.message };
  const target = matches?.[0];
  if (!target) {
    return {
      ok: false,
      message:
        'No student with that email yet — they need to log in once first.',
    };
  }

  const { count } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
  if ((count ?? 0) >= SOCIAL.maxFriends) {
    return { ok: false, message: 'Friend list is full.' };
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: uid,
    addressee_id: target.id,
  });
  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        message: 'A request between you two already exists.',
      };
    }
    return { ok: false, message: error.message };
  }
  revalidatePath('/friends');
  return { ok: true };
}

export async function respondToRequest(
  friendshipId: string,
  accept: boolean,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = accept
    ? await supabase
        .from('friendships')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', friendshipId)
    : await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/friends');
  return { ok: true };
}

export async function removeFriend(
  friendshipId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/friends');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Event RSVPs (P9-4)
// ---------------------------------------------------------------------------

export async function toggleRsvp(
  eventId: string,
): Promise<ActionResult & { going?: boolean }> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: 'Log in to RSVP.' };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('student_id', uid)
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/events');
    return { ok: true, going: false };
  }
  const { error } = await supabase
    .from('event_rsvps')
    .insert({ student_id: uid, event_id: eventId });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/events');
  return { ok: true, going: true };
}
