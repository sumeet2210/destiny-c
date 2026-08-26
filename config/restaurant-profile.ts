// Vocabularies for the owner-editable restaurant profile (P6 profile form).
// Kept as config, not a database enum, so adding a category or cuisine is a code
// change rather than a migration — same reasoning as config/vibes.ts.

export const RESTAURANT_CATEGORIES = [
  'Restaurant',
  'Cafe',
  'Bakery',
  'Dessert shop',
  'Food court',
  'Cloud kitchen',
  'Street food',
  'Dhaba',
] as const;

export const CUISINES = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Italian',
  'Continental',
  'Biryani',
  'Fast Food',
  'Cafe',
  'Desserts',
  'Beverages',
] as const;

export type RestaurantCategory = (typeof RESTAURANT_CATEGORIES)[number];
export type Cuisine = (typeof CUISINES)[number];

export function isRestaurantCategory(
  value: string,
): value is RestaurantCategory {
  return (RESTAURANT_CATEGORIES as readonly string[]).includes(value);
}

export function isCuisine(value: string): value is Cuisine {
  return (CUISINES as readonly string[]).includes(value);
}

/** Amenity toggles, in the order the profile form and public page show them. */
export const AMENITIES = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'outdoor_seating', label: 'Outdoor Seating' },
  { key: 'parking', label: 'Parking' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'upi_card', label: 'UPI/Card' },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { key: 'family_friendly', label: 'Family Friendly' },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]['key'];
