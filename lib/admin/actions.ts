'use server';

// Admin console writes. Ported from backend-branch's admin.controller.js.
//
// SECURITY: unlike lib/owner/actions.ts — where RLS is the real gate because the
// action runs with the owner's own session — these actions run on the
// service-role client and RLS does not apply. Server Actions are independently
// addressable endpoints, so requireAdmin() is called inside every one of them
// rather than relying on the /admin layout having rendered first.

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import type { Enums } from '@/types/db';

export type ActionResult = { ok: boolean; message?: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message:
    'Supabase is not configured — the admin console needs a live project.',
};

const RESTAURANT_STATUSES: Enums<'restaurant_status'>[] = [
  'pending_approval',
  'active',
  'suspended',
];
const USER_ROLES: Enums<'user_role'>[] = ['student', 'owner', 'admin'];

function configured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SECRET_KEY);
}

/**
 * Postgres error messages can carry column names, constraint definitions and
 * row values. The admin sees a generic failure; the detail stays in the server
 * log where only an operator can read it.
 */
function fail(context: string, error: { message: string }): ActionResult {
  console.error(`[admin] ${context}:`, error.message);
  return { ok: false, message: 'That did not go through. Please try again.' };
}

const revalidateAdmin = (path?: string) => {
  revalidatePath('/admin', 'layout');
  if (path) revalidatePath(path);
};

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------

export async function setRestaurantStatus(
  id: string,
  status: Enums<'restaurant_status'>,
): Promise<ActionResult> {
  await requireAdmin();
  if (!configured()) return NOT_CONFIGURED;
  if (!id) return { ok: false, message: 'Missing restaurant.' };
  // Allowlist, not a cast: `status` arrives from a form and the enum is the
  // only thing standing between a client and an arbitrary column value.
  if (!RESTAURANT_STATUSES.includes(status)) {
    return { ok: false, message: 'Unknown status.' };
  }

  const db = createAdminClient();
  const { error } = await db
    .from('restaurants')
    .update({ status })
    .eq('id', id);
  if (error) return fail('setRestaurantStatus', error);

  // Approving a restaurant changes what the public catalog shows, so the
  // student-facing routes have to drop their cache too.
  revalidateAdmin('/admin/restaurants');
  revalidatePath('/', 'layout');
  return { ok: true, message: `Status set to ${status.replace('_', ' ')}.` };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function updateUser(
  id: string,
  patch: { role?: Enums<'user_role'>; nitw_verified?: boolean },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!configured()) return NOT_CONFIGURED;
  if (!id) return { ok: false, message: 'Missing user.' };

  const update: { role?: Enums<'user_role'>; nitw_verified?: boolean } = {};
  if (patch.role !== undefined) {
    if (!USER_ROLES.includes(patch.role)) {
      return { ok: false, message: 'Unknown role.' };
    }
    update.role = patch.role;
  }
  if (patch.nitw_verified !== undefined) {
    update.nitw_verified = Boolean(patch.nitw_verified);
  }
  if (Object.keys(update).length === 0) {
    return { ok: false, message: 'Nothing to change.' };
  }

  // Self-demotion lockout. Nothing else grants the admin role, so an admin who
  // demotes their own account cannot restore it from the UI — it would take a
  // manual database edit. Ported from admin.controller.js, which guards the
  // same way.
  if (id === admin.id && update.role && update.role !== 'admin') {
    return {
      ok: false,
      message: 'You cannot remove your own admin role. Ask another admin.',
    };
  }

  const db = createAdminClient();
  const { error } = await db.from('users').update(update).eq('id', id);
  if (error) return fail('updateUser', error);

  revalidateAdmin('/admin/users');
  return { ok: true, message: 'User updated.' };
}

// ---------------------------------------------------------------------------
// Offer moderation
// ---------------------------------------------------------------------------

export async function moderateOffer(
  id: string,
  action: 'deactivate' | 'clear_flags',
): Promise<ActionResult> {
  await requireAdmin();
  if (!configured()) return NOT_CONFIGURED;
  if (!id) return { ok: false, message: 'Missing offer.' };

  let update: { is_active: boolean } | { flagged_count: number };
  if (action === 'deactivate') update = { is_active: false };
  else if (action === 'clear_flags') update = { flagged_count: 0 };
  else return { ok: false, message: 'Unknown action.' };

  const db = createAdminClient();
  const { error } = await db.from('offers').update(update).eq('id', id);
  if (error) return fail('moderateOffer', error);

  revalidateAdmin('/admin/offers');
  revalidatePath('/', 'layout');
  return {
    ok: true,
    message: action === 'deactivate' ? 'Offer taken down.' : 'Flags cleared.',
  };
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!configured()) return NOT_CONFIGURED;
  if (!id) return { ok: false, message: 'Missing offer.' };

  const db = createAdminClient();
  const { error } = await db.from('offers').delete().eq('id', id);
  if (error) return fail('deleteOffer', error);

  revalidateAdmin('/admin/offers');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Offer deleted.' };
}

// ---------------------------------------------------------------------------
// Review moderation
// ---------------------------------------------------------------------------

export async function deleteReview(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!configured()) return NOT_CONFIGURED;
  if (!id) return { ok: false, message: 'Missing review.' };

  const db = createAdminClient();
  const { error } = await db.from('reviews').delete().eq('id', id);
  if (error) return fail('deleteReview', error);

  // A deleted review moves the restaurant's rating, so the public pages that
  // show it are stale now.
  revalidateAdmin('/admin/reviews');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Review deleted.' };
}
