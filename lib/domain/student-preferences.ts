// What a student is allowed to change about themselves.
//
// Pure and total: every function here turns arbitrary input into a value the
// users table will accept, or reports that it cannot. That matters more than
// usual because server action arguments arrive over the network — TypeScript's
// parameter types are a compile-time convenience, not a runtime boundary, and
// the "users update own profile" RLS policy checks the *row* (id = auth.uid())
// and not which columns are being written. So the allowlist has to live in code.

import {
  FAVORITE_CUISINES,
  isFoodType,
  isSpicePreference,
} from '@/config/food-preferences';
import type { TablesUpdate } from '@/types/db';

/**
 * The columns a student may write on their own row. `role` and `nitw_verified`
 * are the two that must never appear here: the first unlocks the owner portal,
 * the second is the campus-only gate that OTP verification exists to set.
 */
export const STUDENT_WRITABLE_FIELDS = [
  'full_name',
  'phone',
  'hostel',
  'share_activity',
  'food_type',
  'favorite_cuisines',
  'spice_preference',
] as const;

export type StudentWritableField = (typeof STUDENT_WRITABLE_FIELDS)[number];

/**
 * Free-text limits, chosen to match how the values are displayed. Keyed
 * exhaustively rather than with a fallback: a new free-text column added to the
 * allowlist should fail the build until someone picks its limit.
 */
const TEXT_LIMITS: Record<'full_name' | 'phone' | 'hostel', number> = {
  full_name: 80,
  phone: 20,
  hostel: 60,
};

/**
 * Narrowed to the allowlisted columns, so the patch cannot even be *typed* with
 * a privilege column in it. `TablesUpdate` is generated, which also means a
 * renamed or dropped column breaks the build here rather than at runtime.
 */
export type StudentPatch = Pick<TablesUpdate<'users'>, StudentWritableField>;

export type PatchResult =
  { ok: true; patch: StudentPatch } | { ok: false; message: string };

/**
 * Keeps only the allowlisted keys and normalizes each one.
 *
 * Unknown keys are dropped silently rather than rejected: a stale client
 * sending one extra field should still save the fields it got right, and an
 * attacker gets no signal about which column names exist. Bad *values* on
 * allowlisted keys do report an error, because that is a student's typo and
 * they need to know why nothing changed.
 */
export function normalizeStudentPatch(
  input: Record<string, unknown>,
): PatchResult {
  const patch: StudentPatch = {};

  for (const field of STUDENT_WRITABLE_FIELDS) {
    if (!(field in input)) continue;
    const raw = input[field];

    switch (field) {
      case 'share_activity':
        if (typeof raw !== 'boolean') {
          return { ok: false, message: 'Sharing must be on or off.' };
        }
        patch.share_activity = raw;
        break;

      case 'food_type':
        if (raw === null || raw === '') {
          patch.food_type = null;
        } else if (isFoodType(raw)) {
          patch.food_type = raw;
        } else {
          return { ok: false, message: 'Pick one of the listed food types.' };
        }
        break;

      case 'spice_preference':
        if (raw === null || raw === '') {
          patch.spice_preference = null;
        } else if (isSpicePreference(raw)) {
          patch.spice_preference = raw;
        } else {
          return { ok: false, message: 'Pick one of the listed spice levels.' };
        }
        break;

      case 'favorite_cuisines':
        if (!Array.isArray(raw)) {
          return { ok: false, message: 'Cuisines must be a list.' };
        }
        // The column is `not null default '{}'`, so an empty list clears the
        // choice rather than writing null.
        patch.favorite_cuisines = normalizeFavoriteCuisines(raw);
        break;

      default:
        // Everything left is free text, and all of it is nullable.
        patch[field] = normalizeProfileText(raw, TEXT_LIMITS[field]);
    }
  }

  return { ok: true, patch };
}

/**
 * Collapses whitespace, trims, clamps, and turns blank into null.
 *
 * Non-string input becomes null rather than `String(raw)`: a client that sends
 * a number or an object for a name has a bug, and storing "[object Object]"
 * would hide it.
 */
export function normalizeProfileText(
  raw: unknown,
  maxLength: number,
): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.slice(0, maxLength);
}

/**
 * Keeps only known cuisines, deduplicated, in config order.
 *
 * Config order rather than the order the student clicked, so two students with
 * the same tastes produce the same array and the value is stable across saves.
 */
export function normalizeFavoriteCuisines(raw: readonly unknown[]): string[] {
  const chosen = new Set(raw);
  return FAVORITE_CUISINES.filter((cuisine) => chosen.has(cuisine));
}
