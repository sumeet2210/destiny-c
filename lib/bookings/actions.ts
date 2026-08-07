'use server';

// P6-6, P6-8: booking mutations that aren't creation. RLS + the
// booking_update_rules trigger enforce who can change what.

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type ActionResult = { ok: boolean; message?: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: 'Supabase not configured.',
};

/** Student confirms from the reminder: sets confirmed_at, status stays 'confirmed'. */
export async function confirmBooking(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/bookings');
  return { ok: true };
}

export async function cancelBooking(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/bookings');
  return { ok: true };
}

/** Owner leaves a note — note only, never a status change (PRD §5.7). */
export async function setOwnerNote(
  id: string,
  note: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase
    .from('bookings')
    .update({
      owner_note: note.slice(0, 500) || null,
      owner_note_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/owner/bookings');
  return { ok: true };
}
