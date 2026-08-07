// P4-2: session helpers. Server-only. In seed mode (no Supabase configured)
// there is no auth — everything reads as logged out.
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Tables } from '@/types/db';

export type SessionUser = Tables<'users'>;

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  return data ?? null;
});

export async function requireStudent(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== 'student') {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  return user;
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== 'owner') {
    redirect('/owner/login');
  }
  return user;
}

/** The owner's restaurant row (any status), or null. */
export const getOwnedRestaurant = cache(async () => {
  const user = await getSessionUser();
  if (!user || user.role !== 'owner') return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();
  return data ?? null;
});
