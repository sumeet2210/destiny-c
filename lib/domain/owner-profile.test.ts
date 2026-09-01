import { describe, expect, it } from 'vitest';
import {
  buildRestaurantGoogleMapsHref,
  GOOGLE_MAPS_URL_HELP,
  MAX_FOLDER_LENGTH,
  normalizeCategory,
  normalizeCoordinate,
  normalizeCuisines,
  normalizeGalleryFolder,
  normalizeGoogleMapsUrl,
  normalizeIndianPhone,
  normalizeOwnerSignupRestaurant,
  normalizeText,
  validateEventWindow,
  validateOfferWindow,
} from './owner-profile';

describe('normalizeGoogleMapsUrl', () => {
  it.each([
    'https://www.google.com/maps/place/NIT+Warangal',
    'https://maps.google.com/maps?q=NIT+Warangal',
    'https://maps.app.goo.gl/AbCdEf123',
    'https://goo.gl/maps/AbCdEf123',
  ])('accepts a Google Maps link: %s', (url) => {
    const result = normalizeGoogleMapsUrl(url);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toContain('https://');
  });

  it('treats an empty field as optional', () => {
    expect(normalizeGoogleMapsUrl('')).toEqual({ ok: true, value: null });
    expect(normalizeGoogleMapsUrl(null)).toEqual({ ok: true, value: null });
  });

  it.each([
    'http://www.google.com/maps/place/test',
    'https://example.com/maps/place/test',
    'javascript:alert(1)',
    'https://user:pass@www.google.com/maps/place/test',
  ])('rejects an unsafe or unrelated link: %s', (url) => {
    expect(normalizeGoogleMapsUrl(url)).toEqual({
      ok: false,
      message: GOOGLE_MAPS_URL_HELP,
    });
  });
});

describe('buildRestaurantGoogleMapsHref', () => {
  const restaurant = {
    name: 'Campus Cafe',
    address: 'Main Road, Warangal',
    area: 'Nakkalagutta',
    lat: 17.98,
    lng: 79.59,
  };

  it('uses the owner-supplied Google Maps link unchanged', () => {
    const href = buildRestaurantGoogleMapsHref({
      ...restaurant,
      googleMapsUrl: 'https://maps.app.goo.gl/AbCdEf123',
    });
    expect(href).toBe('https://maps.app.goo.gl/AbCdEf123');
  });

  it('falls back to a universal directions URL using the address', () => {
    const href = new URL(buildRestaurantGoogleMapsHref(restaurant));
    expect(`${href.origin}${href.pathname}`).toBe(
      'https://www.google.com/maps/dir/',
    );
    expect(href.searchParams.get('api')).toBe('1');
    expect(href.searchParams.get('destination')).toBe(
      'Campus Cafe, Main Road, Warangal',
    );
  });

  it('falls back safely when a stored link is invalid', () => {
    const href = buildRestaurantGoogleMapsHref({
      ...restaurant,
      googleMapsUrl: 'https://example.com/not-maps',
    });
    expect(href).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//);
  });
});

describe('normalizeOwnerSignupRestaurant', () => {
  const valid = {
    restaurantName: '  Campus   Cafe ',
    ownerName: '  Asha  Rao ',
    phone: '9848012345',
    address: '  12, Main   Road ',
    area: 'Kakatiya',
  };

  it('normalizes all listing details collected during owner signup', () => {
    expect(normalizeOwnerSignupRestaurant(valid)).toEqual({
      ok: true,
      restaurant: {
        name: 'Campus Cafe',
        owner_name: 'Asha Rao',
        phone: '+919848012345',
        address: '12, Main Road',
        area: 'Kakatiya',
      },
    });
  });

  it.each([
    ['restaurant name', { restaurantName: ' ' }],
    ['owner name', { ownerName: ' ' }],
    ['phone number', { phone: '123' }],
    ['address', { address: ' ' }],
    ['area', { area: ' ' }],
  ])('rejects an invalid %s', (_label, patch) => {
    expect(normalizeOwnerSignupRestaurant({ ...valid, ...patch }).ok).toBe(
      false,
    );
  });

  it('accepts and normalizes a manually entered area', () => {
    const result = normalizeOwnerSignupRestaurant({
      ...valid,
      area: '  Nakkalagutta   Main Road ',
    });

    expect(result.ok && result.restaurant.area).toBe('Nakkalagutta Main Road');
  });

  it('requires exactly 10 digits for the signup phone field', () => {
    expect(
      normalizeOwnerSignupRestaurant({ ...valid, phone: '+919848012345' }).ok,
    ).toBe(false);
    expect(
      normalizeOwnerSignupRestaurant({ ...valid, phone: '98480 12345' }).ok,
    ).toBe(false);
  });
});

describe('normalizeIndianPhone', () => {
  it('accepts a bare 10-digit number', () => {
    expect(normalizeIndianPhone('9848012345')).toBe('+919848012345');
  });

  it('accepts an already-normalized number unchanged', () => {
    expect(normalizeIndianPhone('+919848012345')).toBe('+919848012345');
  });

  it('strips the common prefixes owners actually type', () => {
    expect(normalizeIndianPhone('09848012345')).toBe('+919848012345');
    expect(normalizeIndianPhone('919848012345')).toBe('+919848012345');
    expect(normalizeIndianPhone('00919848012345')).toBe('+919848012345');
  });

  it('tolerates spaces, dashes, dots and brackets', () => {
    expect(normalizeIndianPhone('+91 98480 12345')).toBe('+919848012345');
    expect(normalizeIndianPhone('98480-12345')).toBe('+919848012345');
    expect(normalizeIndianPhone('(0) 98480.12345')).toBe('+919848012345');
    expect(normalizeIndianPhone('  9848012345  ')).toBe('+919848012345');
  });

  it('rejects the wrong number of digits', () => {
    expect(normalizeIndianPhone('984801234')).toBeNull();
    expect(normalizeIndianPhone('98480123456')).toBeNull();
    expect(normalizeIndianPhone('')).toBeNull();
  });

  it('rejects leading digits no Indian mobile uses', () => {
    // Landline and reserved ranges must not be stored as a mobile number,
    // because booking notes tell students to call this number.
    expect(normalizeIndianPhone('1234567890')).toBeNull();
    expect(normalizeIndianPhone('5848012345')).toBeNull();
  });

  it('rejects letters and injected text rather than storing them', () => {
    expect(normalizeIndianPhone('98480ABCDE')).toBeNull();
    expect(normalizeIndianPhone('call me maybe')).toBeNull();
    expect(normalizeIndianPhone('+91 9848012345 or 9848012346')).toBeNull();
  });

  it('does not silently truncate a too-long number to a valid one', () => {
    // '9848012345678' must fail, not become '+919848012345'.
    expect(normalizeIndianPhone('9848012345678')).toBeNull();
  });
});

describe('normalizeText', () => {
  it('trims and collapses internal whitespace', () => {
    expect(normalizeText('  Biryani   Adda  ', 50)).toBe('Biryani Adda');
    expect(normalizeText('line\n\nbreak', 50)).toBe('line break');
  });

  it('treats empty and whitespace-only input as absent', () => {
    expect(normalizeText('', 50)).toBeNull();
    expect(normalizeText('   ', 50)).toBeNull();
    expect(normalizeText(null, 50)).toBeNull();
    expect(normalizeText(undefined, 50)).toBeNull();
  });

  it('clamps to the maximum length', () => {
    expect(normalizeText('abcdefghij', 4)).toBe('abcd');
  });

  it('collapses before clamping, so padding cannot eat the limit', () => {
    expect(normalizeText('  ab   cd  ', 5)).toBe('ab cd');
  });
});

describe('normalizeGalleryFolder', () => {
  it('keeps a sensible folder name', () => {
    expect(normalizeGalleryFolder(' Food & Drinks ')).toBe('Food & Drinks');
  });

  it('rejects an empty rename instead of creating a blank folder', () => {
    expect(normalizeGalleryFolder('   ')).toBeNull();
  });

  it('bounds the length so a heading cannot become an essay', () => {
    const long = 'a'.repeat(200);
    expect(normalizeGalleryFolder(long)).toHaveLength(MAX_FOLDER_LENGTH);
  });
});

describe('normalizeCuisines', () => {
  it('keeps known cuisines', () => {
    expect(normalizeCuisines(['Biryani', 'Chinese'])).toEqual([
      'Chinese',
      'Biryani',
    ]);
  });

  it('returns them in config order regardless of input order', () => {
    // Stable ordering keeps the stored array diff-free when an owner re-saves
    // the same selection.
    expect(normalizeCuisines(['Desserts', 'North Indian'])).toEqual([
      'North Indian',
      'Desserts',
    ]);
  });

  it('drops unknown values', () => {
    expect(normalizeCuisines(['Biryani', 'Klingon'])).toEqual(['Biryani']);
    expect(normalizeCuisines(['<script>alert(1)</script>'])).toEqual([]);
  });

  it('de-duplicates', () => {
    expect(normalizeCuisines(['Biryani', 'Biryani'])).toEqual(['Biryani']);
  });

  it('is case-sensitive, so a mis-cased value is dropped not guessed', () => {
    expect(normalizeCuisines(['biryani'])).toEqual([]);
  });

  it('handles an empty selection', () => {
    expect(normalizeCuisines([])).toEqual([]);
  });
});

describe('normalizeCategory', () => {
  it('accepts a configured category', () => {
    expect(normalizeCategory('Cafe')).toBe('Cafe');
  });

  it('rejects anything else', () => {
    expect(normalizeCategory('Bistro')).toBeNull();
    expect(normalizeCategory('cafe')).toBeNull();
  });

  it('treats blank and missing input as no category', () => {
    expect(normalizeCategory('')).toBeNull();
    expect(normalizeCategory(null)).toBeNull();
    expect(normalizeCategory(undefined)).toBeNull();
  });
});

describe('normalizeCoordinate', () => {
  it('accepts a Warangal latitude and longitude', () => {
    expect(normalizeCoordinate('17.9784', 'lat')).toEqual({
      ok: true,
      value: 17.9784,
    });
    expect(normalizeCoordinate(79.5941, 'lng')).toEqual({
      ok: true,
      value: 79.5941,
    });
  });

  it('treats an empty field as "no pin", which is allowed', () => {
    expect(normalizeCoordinate('', 'lat')).toEqual({ ok: true, value: null });
    expect(normalizeCoordinate(null, 'lat')).toEqual({ ok: true, value: null });
    expect(normalizeCoordinate(undefined, 'lng')).toEqual({
      ok: true,
      value: null,
    });
  });

  it('rejects non-numeric input', () => {
    const result = normalizeCoordinate('near the temple', 'lat');
    expect(result.ok).toBe(false);
  });

  it('rejects a swapped lat/lng pair, the most likely mistake', () => {
    // 79.59 is a valid longitude but an impossible latitude.
    expect(normalizeCoordinate(79.5941, 'lat').ok).toBe(false);
    expect(normalizeCoordinate(17.9784, 'lng').ok).toBe(false);
  });

  it('rejects null-island and other far-away typos', () => {
    expect(normalizeCoordinate(0, 'lat').ok).toBe(false);
    expect(normalizeCoordinate(0, 'lng').ok).toBe(false);
    expect(normalizeCoordinate(-17.9, 'lat').ok).toBe(false);
  });

  it('explains which axis was wrong', () => {
    const lat = normalizeCoordinate(99, 'lat');
    const lng = normalizeCoordinate(1, 'lng');
    expect(lat.ok === false && lat.message).toContain('latitude');
    expect(lng.ok === false && lng.message).toContain('longitude');
  });
});

describe('validateOfferWindow', () => {
  const start = '2026-09-01T10:00:00.000Z';
  const later = '2026-09-01T18:00:00.000Z';

  it('accepts a forward window', () => {
    expect(validateOfferWindow(start, later)).toEqual({ ok: true });
  });

  it('accepts an offer with no explicit start', () => {
    expect(validateOfferWindow(null, later)).toEqual({ ok: true });
    expect(validateOfferWindow(undefined, later)).toEqual({ ok: true });
    expect(validateOfferWindow('', later)).toEqual({ ok: true });
  });

  it('rejects an expiry at or before the start', () => {
    expect(validateOfferWindow(later, start).ok).toBe(false);
    expect(validateOfferWindow(start, start).ok).toBe(false);
  });

  it('rejects an unparseable expiry', () => {
    expect(validateOfferWindow(start, 'soon').ok).toBe(false);
    expect(validateOfferWindow(start, '').ok).toBe(false);
  });

  it('rejects an unparseable start', () => {
    expect(validateOfferWindow('whenever', later).ok).toBe(false);
  });

  it('does not care whether the window is in the past', () => {
    // Owners edit historic offers; only the ordering is a rule here. Whether an
    // offer is *live* is decided at read time, not at write time.
    expect(
      validateOfferWindow(
        '2020-01-01T00:00:00.000Z',
        '2020-01-02T00:00:00.000Z',
      ),
    ).toEqual({ ok: true });
  });
});

describe('validateEventWindow', () => {
  const start = '2026-09-01T10:00:00.000Z';
  const later = '2026-09-01T13:00:00.000Z';

  it('accepts a forward window', () => {
    expect(validateEventWindow(start, later)).toEqual({ ok: true });
  });

  it('accepts an open-ended event', () => {
    expect(validateEventWindow(start, null)).toEqual({ ok: true });
    expect(validateEventWindow(start, undefined)).toEqual({ ok: true });
    expect(validateEventWindow(start, '')).toEqual({ ok: true });
  });

  it('rejects an end at or before the start', () => {
    expect(validateEventWindow(later, start).ok).toBe(false);
    expect(validateEventWindow(start, start).ok).toBe(false);
  });

  it('rejects unparseable dates', () => {
    expect(validateEventWindow('tomorrow', later).ok).toBe(false);
    expect(validateEventWindow(start, 'late').ok).toBe(false);
  });

  it('suggests leaving the end time empty when it is wrong', () => {
    const result = validateEventWindow(start, 'late');
    expect(result.ok === false && result.message).toContain('empty');
  });
});
