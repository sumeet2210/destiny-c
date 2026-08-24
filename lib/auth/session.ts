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

/**
 * Redirect targets are role-aware on purpose. Sending a logged-in owner to the
 * student login form is what made owners believe they had been logged out: the
 * session cookie was intact the whole time, they were just looking at a login
 * screen. Only an actual absence of session belongs at /login.
 *
 * Every signed-in role now has a home of its own — students here, owners at
 * /owner/dashboard, admins at /admin — so a role that lands on the wrong portal
 * is sent to its own rather than dumped on the public home.
 */
export async function requireStudent(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  if (user.role === 'owner') redirect('/owner/dashboard');
  if (user.role === 'admin') redirect('/admin');
  if (user.role !== 'student') redirect('/');
  return user;
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/owner/login');
  // Admins sign in through the owner form (both use a password), and that form
  // lands everyone on /owner/dashboard. Bouncing them onward from here is what
  // makes a single login page work for both roles.
  if (user.role === 'admin') redirect('/admin');
  if (user.role !== 'owner') redirect('/');
  return user;
}

/**
 * Gate for the admin console. The schema carries NO admin RLS policies on
 * purpose — owners can't self-approve and students can't reach other students'
 * rows — so every admin read and write runs on the service-role client, which
 * bypasses RLS entirely. This check is the only thing standing in front of that
 * power, which is why lib/queries/admin.ts and lib/admin/actions.ts call it
 * themselves rather than trusting the layout to have run.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/owner/login');
  if (user.role === 'owner') redirect('/owner/dashboard');
  if (user.role !== 'admin') redirect('/');
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
