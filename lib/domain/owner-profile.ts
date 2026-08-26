// Pure validation rules for the owner profile, offer and event forms.
//
// Lives here rather than inline in lib/owner/actions.ts so every rule is unit
// testable without a Supabase session (README: "pure unit-tested rules in
// lib/domain"). The server actions are the only caller, and they call these
// before touching the database — the DB checks are the second layer, not the
// first.

import { CUISINES, isRestaurantCategory } from '@/config/restaurant-profile';
import { AREAS, type Area } from '@/config/areas';

/**
 * Owners type phone numbers every which way: "9848012345", "098480 12345",
 * "+91-98480-12345", "0091 9848012345". Normalize to the single shape the
 * `restaurants_phone_check` style `^\+91\d{10}$` format expects, or return null
 * when it cannot be salvaged. An Indian mobile number never starts 0-5.
 */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/[\s()\-.]/g, '');
  const bare = digits
    .replace(/^\+91/, '')
    .replace(/^0091/, '')
    .replace(/^91(?=\d{10}$)/, '')
    .replace(/^0(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(bare)) return null;
  return `+91${bare}`;
}

export const PHONE_HELP =
  'Enter a 10-digit Indian mobile number, with or without +91.';

export type OwnerSignupRestaurantInput = {
  restaurantName: string;
  ownerName: string;
  phone: string;
  address: string;
  area: string;
};

export type OwnerSignupRestaurant = {
  name: string;
  owner_name: string;
  phone: string;
  address: string;
  area: Area;
};

export function normalizeOwnerSignupRestaurant(
  input: OwnerSignupRestaurantInput,
):
  | { ok: true; restaurant: OwnerSignupRestaurant }
  | { ok: false; message: string } {
  const name = normalizeText(input.restaurantName, 120);
  if (!name) return { ok: false, message: 'Enter your restaurant name.' };

  const ownerName = normalizeText(input.ownerName, 80);
  if (!ownerName) return { ok: false, message: 'Enter the owner name.' };

  const phone = normalizeIndianPhone(input.phone);
  if (!phone) return { ok: false, message: PHONE_HELP };

  const address = normalizeText(input.address, 240);
  if (!address) return { ok: false, message: 'Enter the restaurant address.' };

  if (!AREAS.includes(input.area as Area)) {
    return { ok: false, message: 'Choose a valid restaurant area.' };
  }

  return {
    ok: true,
    restaurant: {
      name,
      owner_name: ownerName,
      phone,
      address,
      area: input.area as Area,
    },
  };
}

/** Trim, collapse runs of whitespace, and clamp. Empty becomes null. */
export function normalizeText(
  raw: string | null | undefined,
  maxLength: number,
): string | null {
  if (raw === null || raw === undefined) return null;
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.slice(0, maxLength);
}

export const MAX_FOLDER_LENGTH = 40;

/**
 * Gallery folder names are owner-authored, so there is no CHECK constraint to
 * fall back on — bound the length here or an owner can write an essay into a
 * column the public gallery renders as a heading.
 */
export function normalizeGalleryFolder(raw: string): string | null {
  return normalizeText(raw, MAX_FOLDER_LENGTH);
}

/** Keep only known cuisines, de-duplicated, in config order for stable diffs. */
export function normalizeCuisines(raw: readonly string[]): string[] {
  const chosen = new Set(raw);
  return CUISINES.filter((cuisine) => chosen.has(cuisine));
}

/** Null unless it is one of the configured categories. */
export function normalizeCategory(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  return isRestaurantCategory(raw) ? raw : null;
}

/**
 * Coordinates are optional — a restaurant with no pin still browses fine, and
 * distance may never block browsing (PRODUCT.md). Reject anything outside the
 * plausible box for Warangal district so a typo cannot drop a pin in the sea:
 * roughly 17.2-18.6 N, 78.8-80.2 E.
 */
export function normalizeCoordinate(
  raw: string | number | null | undefined,
  axis: 'lat' | 'lng',
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (raw === null || raw === undefined || raw === '') {
    return { ok: true, value: null };
  }
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) {
    return { ok: false, message: 'Coordinates must be numbers.' };
  }
  const [min, max] = axis === 'lat' ? [17.2, 18.6] : [78.8, 80.2];
  if (value < min || value > max) {
    return {
      ok: false,
      message: `That ${axis === 'lat' ? 'latitude' : 'longitude'} is outside Warangal — expected ${min} to ${max}.`,
    };
  }
  return { ok: true, value };
}

export type WindowCheck = { ok: true } | { ok: false; message: string };

/**
 * An offer that expires before it starts is invisible, and an offer with no
 * expiry can never be trusted as "live" — PRD §5.5 makes expiry mandatory. The
 * public ticker sorts by soonest expiry, so a backwards window would sort a
 * dead offer to the front.
 */
export function validateOfferWindow(
  startsAt: string | null | undefined,
  expiresAt: string,
): WindowCheck {
  const expires = new Date(expiresAt).getTime();
  if (!Number.isFinite(expires)) {
    return { ok: false, message: 'Choose a valid expiry date and time.' };
  }
  if (startsAt) {
    const starts = new Date(startsAt).getTime();
    if (!Number.isFinite(starts)) {
      return { ok: false, message: 'Choose a valid start date and time.' };
    }
    if (starts >= expires) {
      return { ok: false, message: 'The offer must expire after it starts.' };
    }
  }
  return { ok: true };
}

/** Same idea for events, where ends_at is optional. */
export function validateEventWindow(
  startsAt: string,
  endsAt: string | null | undefined,
): WindowCheck {
  const starts = new Date(startsAt).getTime();
  if (!Number.isFinite(starts)) {
    return { ok: false, message: 'Choose a valid event date and time.' };
  }
  if (!endsAt) return { ok: true };
  const ends = new Date(endsAt).getTime();
  if (!Number.isFinite(ends)) {
    return {
      ok: false,
      message: 'Choose a valid end time, or leave it empty.',
    };
  }
  if (ends <= starts) {
    return { ok: false, message: 'The event must end after it starts.' };
  }
  return { ok: true };
}
