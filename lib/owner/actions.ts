'use server';

// Phase 5: owner tools. RLS is the real gate on every write here — these
// actions run with the owner's session, never the secret key.

import { revalidatePath } from 'next/cache';
import {
  GOOGLE_MAPS_URL_HELP,
  normalizeCoordinate,
  normalizeGalleryFolder,
  normalizeGoogleMapsUrl,
  normalizeIndianPhone,
  normalizeText,
  PHONE_HELP,
  validateEventWindow,
  validateOfferWindow,
} from '@/lib/domain/owner-profile';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { TablesInsert, TablesUpdate } from '@/types/db';

export type ActionResult = { ok: boolean; message?: string; url?: string };

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

function normalizeOptionList(
  values: unknown,
  { maxItems = 20, maxLength = 60 } = {},
): string[] {
  if (!Array.isArray(values)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const clean = normalizeText(value, maxLength);
    const key = clean?.toLocaleLowerCase('en-IN');
    if (!clean || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length === maxItems) break;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Restaurant profile (P4-3 create, P5-2 edit, P5-3 hours)
// ---------------------------------------------------------------------------

/**
 * Clean the owner-supplied profile fields in place. `restaurants` has no length
 * or format CHECK constraints, so this is the only bound on what reaches the
 * public page. Returns a message when a value is wrong in a way the owner has
 * to fix rather than one we can quietly normalize.
 */
function normalizeProfilePatch(
  patch: Record<string, unknown>,
  { requirePhone = false }: { requirePhone?: boolean } = {},
): string | undefined {
  const lengths: Record<string, number> = {
    name: 120,
    area: 80,
    address: 240,
    description: 600,
    owner_name: 80,
  };
  for (const [field, max] of Object.entries(lengths)) {
    if (field in patch && typeof patch[field] === 'string') {
      patch[field] = normalizeText(patch[field] as string, max);
    }
  }
  // `name` and `area` are NOT NULL — an all-whitespace submission must be
  // rejected, not sent on as null for Postgres to reject with a raw error.
  for (const field of ['name', 'area'] as const) {
    if (field in patch && patch[field] === null) {
      return field === 'name'
        ? 'Restaurant name cannot be empty.'
        : 'Area cannot be empty.';
    }
  }

  if ('phone' in patch) {
    const raw = patch.phone;
    if (typeof raw === 'string' && raw.trim()) {
      const phone = normalizeIndianPhone(raw);
      if (!phone) return PHONE_HELP;
      patch.phone = phone;
    } else if (raw === '' || raw === null) {
      if (requirePhone) return PHONE_HELP;
      patch.phone = null;
    }
  }

  if ('google_maps_url' in patch) {
    const mapsUrl = normalizeGoogleMapsUrl(
      patch.google_maps_url as string | null | undefined,
    );
    if (!mapsUrl.ok) return mapsUrl.message || GOOGLE_MAPS_URL_HELP;
    patch.google_maps_url = mapsUrl.value;
  }

  for (const axis of ['lat', 'lng'] as const) {
    if (axis in patch) {
      const result = normalizeCoordinate(
        patch[axis] as string | number | null,
        axis,
      );
      if (!result.ok) return result.message;
      patch[axis] = result.value;
    }
  }

  if ('restaurant_category' in patch) {
    patch.restaurant_category = normalizeText(
      patch.restaurant_category as string | null,
      60,
    );
  }
  for (const field of [
    'restaurant_categories',
    'cuisines',
    'custom_facilities',
    'vibe_tags',
  ] as const) {
    if (field in patch) patch[field] = normalizeOptionList(patch[field]);
  }
  if ('restaurant_categories' in patch) {
    const categories = patch.restaurant_categories as string[];
    // Keep the legacy singular field in sync for older consumers.
    patch.restaurant_category = categories[0] ?? null;
  }
  return undefined;
}

export async function createRestaurant(
  input: Pick<
    TablesInsert<'restaurants'>,
    'name' | 'area' | 'address' | 'phone' | 'description' | 'google_maps_url'
  > & { lat?: number | null; lng?: number | null },
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not logged in.' };

  const fields = { ...input } as Record<string, unknown>;
  const invalid = normalizeProfilePatch(fields);
  if (invalid) return { ok: false, message: invalid };

  const { error } = await supabase.from('restaurants').insert({
    ...(fields as typeof input),
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
  const invalid = normalizeProfilePatch(patch as Record<string, unknown>, {
    requirePhone: 'phone' in patch,
  });
  if (invalid) return { ok: false, message: invalid };
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
  section_name: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const supabase = await createClient();
  const sectionName = normalizeText(input.section_name, 60);
  if (!sectionName) return { ok: false, message: 'Choose a menu subsection.' };
  const name = normalizeText(input.name, 120);
  if (!name) return { ok: false, message: 'Give the menu item a name.' };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, message: 'Enter a valid price.' };
  }
  const { data: section, error: sectionError } = await supabase
    .from('menu_sections')
    .select('id')
    .eq('restaurant_id', owned.id)
    .eq('name', sectionName)
    .maybeSingle();
  if (sectionError) return { ok: false, message: sectionError.message };
  if (!section) return { ok: false, message: 'Create that subsection first.' };
  const { id, ...inputFields } = input;
  const fields = { ...inputFields, name, section_name: sectionName };
  const { error } = id
    ? await supabase.from('menu_items').update(fields).eq('id', id)
    : await supabase
        .from('menu_items')
        .insert({ ...fields, restaurant_id: owned.id });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/owner', 'layout');
  revalidatePath('/owner/menu');
  revalidatePath(`/restaurant/${owned.id}`);
  revalidatePath('/search');
  revalidatePath('/');
  return { ok: true };
}

export async function createMenuSection(name: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const clean = normalizeText(name, 60);
  if (!clean) return { ok: false, message: 'Give the subsection a name.' };
  const supabase = await createClient();
  const { data: last, error: orderError } = await supabase
    .from('menu_sections')
    .select('sort_order')
    .eq('restaurant_id', owned.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) return { ok: false, message: orderError.message };
  const { error } = await supabase.from('menu_sections').insert({
    restaurant_id: owned.id,
    name: clean,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'That subsection already exists.'
          : error.message,
    };
  }
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
  starts_at?: string | null;
  expires_at?: string; // defaults to end of day IST (PRD §5.5)
  image_url: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;

  const title = normalizeText(input.title, 120);
  if (!title) return { ok: false, message: 'Give the offer a title.' };
  const imageUrl = normalizeText(input.image_url, 500);
  if (!imageUrl) return { ok: false, message: 'Add an offer photo.' };

  let expires = input.expires_at;
  if (!expires) {
    // End of today in IST.
    const now = new Date(Date.now() + 330 * 60_000);
    now.setUTCHours(23, 59, 59, 0);
    expires = new Date(now.getTime() - 330 * 60_000).toISOString();
  }

  const window = validateOfferWindow(input.starts_at, expires);
  if (!window.ok) return { ok: false, message: window.message };

  const supabase = await createClient();
  const { error } = await supabase.from('offers').insert({
    restaurant_id: owned.id,
    title,
    description: normalizeText(input.description, 400),
    discount_text: normalizeText(input.discount_text, 60),
    // Leaving starts_at unset lets the column default stand (offer is live
    // immediately), which is what the baseline form has always done.
    ...(input.starts_at ? { starts_at: input.starts_at } : {}),
    expires_at: expires,
    image_url: imageUrl,
  });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/offers-events');
  revalidatePath('/');
  revalidatePath(`/restaurant/${owned.id}`);
  return { ok: true };
}

export async function updateOffer(
  id: string,
  patch: Pick<
    TablesUpdate<'offers'>,
    | 'title'
    | 'description'
    | 'discount_text'
    | 'starts_at'
    | 'expires_at'
    | 'is_active'
    | 'image_url'
  >,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const supabase = await createClient();

  // A patch may move either end of the window, so validate the merged result
  // against the stored row rather than the patch alone.
  if (patch.starts_at !== undefined || patch.expires_at !== undefined) {
    const { data: current } = await supabase
      .from('offers')
      .select('starts_at, expires_at')
      .eq('id', id)
      .eq('restaurant_id', owned.id)
      .maybeSingle();
    if (!current) return { ok: false, message: 'Offer not found.' };
    const window = validateOfferWindow(
      patch.starts_at !== undefined ? patch.starts_at : current.starts_at,
      patch.expires_at !== undefined
        ? (patch.expires_at as string)
        : current.expires_at,
    );
    if (!window.ok) return { ok: false, message: window.message };
  }

  if (typeof patch.title === 'string') {
    const title = normalizeText(patch.title, 120);
    if (!title) return { ok: false, message: 'Give the offer a title.' };
    patch.title = title;
  }
  if (typeof patch.description === 'string') {
    patch.description = normalizeText(patch.description, 400);
  }
  if (typeof patch.discount_text === 'string') {
    patch.discount_text = normalizeText(patch.discount_text, 60);
  }

  const { error } = await supabase
    .from('offers')
    .update(patch)
    .eq('id', id)
    .eq('restaurant_id', owned.id);
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/offers-events');
  revalidatePath('/');
  revalidatePath(`/restaurant/${owned.id}`);
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
  cover_image_url?: string | null;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const startsAt = new Date(input.starts_at);
  if (!input.id && !normalizeText(input.cover_image_url, 500)) {
    return { ok: false, message: 'Add an event photo.' };
  }
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
  const window = validateEventWindow(input.starts_at, input.ends_at);
  if (!window.ok) return { ok: false, message: window.message };
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
    ...(fields.cover_image_url !== undefined
      ? { cover_image_url: normalizeText(fields.cover_image_url, 500) }
      : {}),
  };
  const { error } = id
    ? await supabase.from('events').update(payload).eq('id', id)
    : await supabase
        .from('events')
        .insert({ ...payload, restaurant_id: owned.id });
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/offers-events');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Photos (P5-5, P5-6) — file arrives pre-resized to ≤1600px WebP from the
// client (architecture.md §1 storage budget); server re-checks size only.
// ---------------------------------------------------------------------------

const MAX_UPLOAD_BYTES = 1_500_000;

export async function uploadPromotionImage(
  formData: FormData,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'No file received.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'Image is too large even after resizing.' };
  }
  const supabase = await createClient();
  const path = `${owned.id}/promotions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage
    .from('restaurant-images')
    .upload(path, file, { contentType: 'image/webp' });
  if (error) return { ok: false, message: error.message };
  const {
    data: { publicUrl },
  } = supabase.storage.from('restaurant-images').getPublicUrl(path);
  return { ok: true, url: publicUrl };
}

export async function uploadPhoto(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;

  const file = formData.get('file');
  const kind = formData.get('kind') === 'menu_photo' ? 'menu_photo' : 'gallery';
  const asCover = formData.get('as_cover') === '1';
  // Owner-named album, e.g. "Ambience" or "Food & Drinks". Only meaningful for
  // gallery photos; menu photos are their own surface.
  const folderRaw = formData.get('gallery_category');
  const folder =
    kind === 'gallery' && typeof folderRaw === 'string'
      ? normalizeGalleryFolder(folderRaw)
      : null;
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'No file received.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'Image is too large even after resizing.' };
  }

  const supabase = await createClient();
  if (folder) {
    const { data: savedFolder, error: folderError } = await supabase
      .from('restaurant_gallery_folders')
      .select('id')
      .eq('restaurant_id', owned.id)
      .eq('name', folder)
      .maybeSingle();
    if (folderError) return { ok: false, message: folderError.message };
    if (!savedFolder) {
      return { ok: false, message: 'Create that folder before adding photos.' };
    }
  }
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
      gallery_category: folder,
    });
    if (error) return { ok: false, message: error.message };
  }
  revalidateOwnerAnd('/owner/profile');
  revalidatePath('/owner/menu');
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
  revalidateOwnerAnd('/owner/profile');
  revalidatePath('/owner/menu');
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
  revalidateOwnerAnd('/owner/profile');
  revalidatePath('/owner/menu');
  return { ok: true };
}

/** Create an empty gallery folder before photos are uploaded into it. */
export async function createGalleryFolder(name: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const clean = normalizeGalleryFolder(name);
  if (!clean) return { ok: false, message: 'Give the folder a name.' };
  const supabase = await createClient();
  const { data: lastFolder, error: orderError } = await supabase
    .from('restaurant_gallery_folders')
    .select('sort_order')
    .eq('restaurant_id', owned.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) return { ok: false, message: orderError.message };
  const { error } = await supabase.from('restaurant_gallery_folders').insert({
    restaurant_id: owned.id,
    name: clean,
    sort_order: (lastFolder?.sort_order ?? -1) + 1,
  });
  if (error) {
    return {
      ok: false,
      message:
        error.code === '23505'
          ? 'A folder with that name already exists.'
          : error.message,
    };
  }
  revalidateOwnerAnd('/owner/profile');
  return { ok: true };
}

/** Move one photo between albums. Passing null returns it to the unfiled set. */
export async function setPhotoFolder(
  id: string,
  folder: string | null,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const clean = folder === null ? null : normalizeGalleryFolder(folder);
  if (folder !== null && !clean) {
    return { ok: false, message: 'Give the folder a name.' };
  }
  const supabase = await createClient();
  if (clean) {
    const { data: savedFolder, error: folderError } = await supabase
      .from('restaurant_gallery_folders')
      .select('id')
      .eq('restaurant_id', owned.id)
      .eq('name', clean)
      .maybeSingle();
    if (folderError) return { ok: false, message: folderError.message };
    if (!savedFolder) {
      return { ok: false, message: 'Create that folder before moving photos.' };
    }
  }
  const { error } = await supabase
    .from('restaurant_photos')
    .update({ gallery_category: clean })
    .eq('id', id)
    .eq('restaurant_id', owned.id);
  if (error) return { ok: false, message: error.message };
  revalidateOwnerAnd('/owner/profile');
  return { ok: true };
}

/**
 * Rename an album in one shot. Scoped by restaurant_id as well as folder name so
 * a rename can never reach another owner's photos even if RLS were mis-set.
 */
export async function renameGalleryFolder(
  from: string,
  to: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const owned = await ownedRestaurantId();
  if (!owned.ok) return owned;
  const current = normalizeGalleryFolder(from);
  const next = normalizeGalleryFolder(to);
  if (!current) return { ok: false, message: 'Unknown folder.' };
  if (!next) return { ok: false, message: 'Give the folder a name.' };
  if (current === next) return { ok: true };
  const supabase = await createClient();
  const { data: renamedFolder, error: folderError } = await supabase
    .from('restaurant_gallery_folders')
    .update({ name: next })
    .eq('restaurant_id', owned.id)
    .eq('name', current)
    .select('id')
    .maybeSingle();
  if (folderError) {
    return {
      ok: false,
      message:
        folderError.code === '23505'
          ? 'A folder with that name already exists.'
          : folderError.message,
    };
  }
  if (!renamedFolder) return { ok: false, message: 'Unknown folder.' };
  const { error: photoError } = await supabase
    .from('restaurant_photos')
    .update({ gallery_category: next })
    .eq('restaurant_id', owned.id)
    .eq('gallery_category', current);
  if (photoError) {
    // Best-effort rollback keeps the folder label aligned with its photos.
    await supabase
      .from('restaurant_gallery_folders')
      .update({ name: current })
      .eq('restaurant_id', owned.id)
      .eq('name', next);
    return { ok: false, message: photoError.message };
  }
  revalidateOwnerAnd('/owner/profile');
  return { ok: true };
}
