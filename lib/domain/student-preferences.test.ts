import { describe, expect, it } from 'vitest';
import {
  normalizeFavoriteCuisines,
  normalizeProfileText,
  normalizeStudentPatch,
  STUDENT_WRITABLE_FIELDS,
} from './student-preferences';

const patchOf = (input: Record<string, unknown>) => {
  const result = normalizeStudentPatch(input);
  if (!result.ok) throw new Error(`expected ok, got: ${result.message}`);
  return result.patch;
};

describe('STUDENT_WRITABLE_FIELDS', () => {
  it('never includes a privilege column', () => {
    // The whole point of the allowlist. If one of these is ever added, a
    // student can promote themselves to owner or fake campus verification.
    for (const forbidden of [
      'role',
      'nitw_verified',
      'id',
      'email',
      'created_at',
      'no_show_count',
    ]) {
      expect(STUDENT_WRITABLE_FIELDS).not.toContain(forbidden);
    }
  });
});

describe('normalizeStudentPatch', () => {
  it('drops keys that are not on the allowlist', () => {
    expect(
      patchOf({ hostel: '1.8k block', role: 'owner', nitw_verified: true }),
    ).toEqual({ hostel: '1.8k block' });
  });

  it('drops an unknown key without failing the rest of the save', () => {
    // A stale client sending one extra field should still save what it got
    // right, and an attacker learns nothing about which columns exist.
    expect(patchOf({ hostel: 'Ambedkar', nonsense: 1 })).toEqual({
      hostel: 'Ambedkar',
    });
  });

  it('omits fields the caller did not send', () => {
    // Absent must mean "leave alone", never "reset to null" — the sharing
    // toggle and the hostel field save independently of each other.
    expect(patchOf({ share_activity: true })).toEqual({ share_activity: true });
  });

  it('keeps an explicit null so a student can clear a field', () => {
    expect(patchOf({ hostel: null, food_type: null })).toEqual({
      hostel: null,
      food_type: null,
    });
  });

  it('treats blank text as clearing the field', () => {
    expect(patchOf({ hostel: '   ' })).toEqual({ hostel: null });
  });

  it('collapses and clamps free text', () => {
    expect(patchOf({ full_name: '  Aarav   Sharma  ' })).toEqual({
      full_name: 'Aarav Sharma',
    });
    const long = patchOf({ full_name: 'x'.repeat(200) });
    expect(String(long.full_name)).toHaveLength(80);
  });

  it('refuses a non-boolean sharing value', () => {
    // 'true' as a string is the classic form-encoding slip, and it would be
    // truthy in Postgres — better to reject it loudly.
    const result = normalizeStudentPatch({ share_activity: 'true' });
    expect(result.ok).toBe(false);
  });

  it('accepts the listed food types', () => {
    expect(patchOf({ food_type: 'vegan' })).toEqual({ food_type: 'vegan' });
  });

  it('refuses a food type the CHECK constraint would reject', () => {
    const result = normalizeStudentPatch({ food_type: 'carnivore' });
    expect(result).toEqual({
      ok: false,
      message: 'Pick one of the listed food types.',
    });
  });

  it('accepts the listed spice levels and refuses others', () => {
    expect(patchOf({ spice_preference: 'high' })).toEqual({
      spice_preference: 'high',
    });
    expect(normalizeStudentPatch({ spice_preference: 'extra hot' }).ok).toBe(
      false,
    );
  });

  it('treats an empty string as clearing a single-choice field', () => {
    // The <select> that renders these has an empty "No preference" option.
    expect(patchOf({ food_type: '', spice_preference: '' })).toEqual({
      food_type: null,
      spice_preference: null,
    });
  });

  it('refuses a non-array cuisine value', () => {
    expect(normalizeStudentPatch({ favorite_cuisines: 'Indian' }).ok).toBe(
      false,
    );
  });

  it('writes an empty list rather than null when cuisines are cleared', () => {
    // The column is `not null default '{}'`.
    expect(patchOf({ favorite_cuisines: [] })).toEqual({
      favorite_cuisines: [],
    });
  });

  it('keeps bounded custom cuisines after configured options', () => {
    expect(
      patchOf({ favorite_cuisines: ['Indian', 'Klingon', 'Biryani'] }),
    ).toEqual({ favorite_cuisines: ['Indian', 'Biryani', 'Klingon'] });
  });

  it('does not mutate its input', () => {
    const input = { hostel: ' Ambedkar ', favorite_cuisines: ['Indian'] };
    const snapshot = JSON.parse(JSON.stringify(input));
    normalizeStudentPatch(input);
    expect(input).toEqual(snapshot);
  });
});

describe('normalizeProfileText', () => {
  it('turns non-string input into null rather than stringifying it', () => {
    expect(normalizeProfileText(42, 10)).toBeNull();
    expect(normalizeProfileText({}, 10)).toBeNull();
    expect(normalizeProfileText(undefined, 10)).toBeNull();
  });

  it('clamps to the limit', () => {
    expect(normalizeProfileText('abcdef', 3)).toBe('abc');
  });
});

describe('normalizeFavoriteCuisines', () => {
  it('returns config order, not click order', () => {
    // Two students with the same tastes must produce the same array, so a save
    // that changes nothing writes nothing new.
    expect(normalizeFavoriteCuisines(['Biryani', 'Indian'])).toEqual([
      'Indian',
      'Biryani',
    ]);
  });

  it('deduplicates', () => {
    expect(normalizeFavoriteCuisines(['Indian', 'Indian'])).toEqual(['Indian']);
  });

  it('canonicalizes configured cuisines case-insensitively', () => {
    expect(normalizeFavoriteCuisines(['indian'])).toEqual(['Indian']);
  });

  it('ignores non-string entries', () => {
    expect(normalizeFavoriteCuisines([null, 7, 'Indian'])).toEqual(['Indian']);
  });

  it('trims, clamps and case-insensitively deduplicates custom cuisines', () => {
    expect(
      normalizeFavoriteCuisines([
        '  Korean   BBQ ',
        'korean bbq',
        'x'.repeat(100),
      ]),
    ).toEqual(['Korean BBQ', 'x'.repeat(40)]);
  });
});
