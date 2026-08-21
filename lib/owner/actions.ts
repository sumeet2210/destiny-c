'use server';

// Phase 5: owner tools. RLS is the real gate on every write here — these
// actions run with the owner's session, never the secret key.

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { TablesInsert, TablesUpdate } from '@/types/db';

export type ActionResult = { ok: boolean; message?: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: 'Supabase is not configured — owner tools need a live project.',
};

async function ownedRestaurantId(): Promise<
  { ok: true; id: string } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };
  const { data } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!data)
    return { ok: false, message: 'No restaurant on this account yet.' };
  return { ok: true, id: data.id };
}

const revalidateOwnerAnd = (path: string) => {
  revalidatePath('/owner', 'layout');
  revalidatePath(path);
};

// ---------------------------------------------------------------------------
// Restaurant profile (P4-3 create, P5-2 edit, P5-3 hours)
// ---------------------------------------------------------------------------

export async function createRestaurant(
  input: Pick<
    TablesInsert<'restaurants'>,
    'name' | 'area' | 'address' | 'phone' | 'description'
  > & { lat?: number | null; lng?: number | null },
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };

  const { error } = await supabase.from('restaurants').insert({
    ...input,
    owner_id: user.id,
    status: 'pending_approval',
  });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/dashboard');
  return { ok: true };
}

export async function updateRestaurant(
  patch: Omit<TablesUpdate<'restaurants'>, 'opening_hours'> & {
    opening_hours?: import('@/lib/domain/hours').OpeningHours | null;
  },
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  // Never let the owner touch status or ownership from here.
  delete patch.status;
  delete patch.owner_id;
  delete patch.id;
  const supabase = await createClient();
  const { error } = await supabase
    .from('restaurants')
    .update(patch as TablesUpdate<'restaurants'>)
    .eq('id', owned.id);
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Menu (P5-4)
// ---------------------------------------------------------------------------

export async function upsertMenuItem(input: {
  id?: string;
  name: string;
  price: number;
  is_veg: boolean;
  craving_tags: string[];
  is_available: boolean;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const supabase = await createClient();
  const { id, ...fields } = input;
  const { error } = id
    ? await supabase.from('menu_items').update(fields).eq('id', id)
    : await supabase
        .from('menu_items')
        .insert({ ...fields, restaurant_id: owned.id });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/menu');
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/menu');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Offers (P5-7, P5-8)
// ---------------------------------------------------------------------------

export async function createOffer(input: {
  title: string;
  description?: string;
  discount_text?: string;
  expires_at?: string; // defaults to end of day IST (PRD §5.5)
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;

  let expires = input.expires_at;
  if (!expires) {
    // End of today in IST.
    const now = new Date(Date.now() + 330 * 60_000);
    now.setUTCHours(23, 59, 59, 0);
    expires = new Date(now.getTime() - 330 * 60_000).toISOString();
  }

  const supabase = await createClient();
  const { error } = await supabase.from('offers').insert({
    restaurant_id: owned.id,
    title: input.title,
    description: input.description || null,
    discount_text: input.discount_text || null,
    expires_at: expires,
  });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/offers');
  return { ok: true };
}

export async function updateOffer(
  id: string,
  patch: Pick<
    TablesUpdate<'offers'>,
    'title' | 'description' | 'discount_text' | 'expires_at' | 'is_active'
  >,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase.from('offers').update(patch).eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/offers');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Events (P5-9)
// ---------------------------------------------------------------------------

export async function upsertEvent(input: {
  id?: string;
  title: string;
  description?: string;
  event_type: string;
  starts_at: string;
  ends_at?: string | null;
  entry_fee?: number | null;
  location_details?: string;
  ticket_url?: string;
  is_cancelled?: boolean;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const startsAt = new Date(input.starts_at);
  const publishLimit = Date.now() + 15 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(startsAt.getTime())) {
    return { ok: false, message: 'Choose a valid event date and time.' };
  }
  if (startsAt.getTime() > publishLimit) {
    return {
      ok: false,
      message: 'Events can be scheduled up to 15 days ahead.',
    };
  }
  if (input.ticket_url) {
    try {
      const ticketUrl = new URL(input.ticket_url);
      if (!['http:', 'https:'].includes(ticketUrl.protocol)) throw new Error();
    } catch {
      return { ok: false, message: 'Ticket link must be a valid web address.' };
    }
  }
  const supabase = await createClient();
  const { id, ...fields } = input;
  const payload = {
    ...fields,
    event_type: fields.event_type as TablesInsert<'events'>['event_type'],
    description: fields.description || null,
    ends_at: fields.ends_at || null,
    entry_fee: fields.entry_fee ?? null,
    location_details: fields.location_details || null,
    ticket_url: fields.ticket_url || null,
  };
  const { error } = id
    ? await supabase.from('events').update(payload).eq('id', id)
    : await supabase
        .from('events')
        .insert({ ...payload, restaurant_id: owned.id });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/events');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Photos (P5-5, P5-6) — file arrives pre-resized to ≤1600px WebP from the
// client (architecture.md §1 storage budget); server re-checks size only.
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 1_500_000;

export async function uploadPhoto(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;

  const file = formData.get('file');
  const kind = formData.get('kind') === 'menu_photo' ? 'menu_photo' : 'gallery';
  const asCover = formData.get('as_cover') === '1';
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'No file received.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'Image is too large even after resizing.' };
  }

  const supabase = await createClient();
  const path = `${owned.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error: uploadError } = await supabase.storage
    .from('restaurant-images')
    .upload(path, file, { contentType: 'image/webp' });
  if (uploadError) return { ok: false, message: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('restaurant-images').getPublicUrl(path);

  if (asCover) {
    const { error } = await supabase
      .from('restaurants')
      .update({ cover_image_url: publicUrl })
      .eq('id', owned.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from('restaurant_photos').insert({
      restaurant_id: owned.id,
      url: publicUrl,
      kind,
    });
    if (error) return { ok: false, message: error.message };
  }
  revalidateOwnerAnd('/owner/photos');
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from('restaurant_photos')
    .select('url')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase
    .from('restaurant_photos')
    .delete()
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  // Best-effort storage cleanup.
  if (photo?.url) {
    const marker = '/restaurant-images/';
    const idx = photo.url.indexOf(marker);
    if (idx !== -1) {
      await supabase.storage
        .from('restaurant-images')
        .remove([photo.url.slice(idx + marker.length)]);
    }
  }
  revalidateOwnerAnd('/owner/photos');
  return { ok: true };
}

export async function reorderPhotos(ids: string[]): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from('restaurant_photos')
      .update({ sort_order: i })
      .eq('id', ids[i]);
    if (error) return { ok: false, message: error.message };
  }
  revalidateOwnerAnd('/owner/photos');
  return { ok: true };
}
