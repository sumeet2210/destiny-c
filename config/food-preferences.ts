// Student taste preferences (account page). Config, not database enums, so the
// vocabularies can grow without a migration — the CHECK constraints in
// 20260828100300_student_food_preferences.sql cover only food_type and
// spice_preference, which are stable.

export const FOOD_TYPES = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'other', label: 'Other' },
] as const;

export type FoodType = (typeof FOOD_TYPES)[number]['value'];

export const FAVORITE_CUISINES = [
  'Indian',
  'Chinese',
  'Italian',
  'Fast Food',
  'Mexican',
  'South Indian',
  'North Indian',
  'Desserts',
  'Cafe / Bakery',
  'Biryani',
  'Street Food',
  'Continental',
] as const;

export type FavoriteCuisine = (typeof FAVORITE_CUISINES)[number];

export const SPICE_PREFERENCES = [
  { value: 'low', label: 'Low', level: 1 },
  { value: 'medium', label: 'Medium', level: 2 },
  { value: 'high', label: 'High', level: 3 },
] as const;

export type SpicePreference = (typeof SPICE_PREFERENCES)[number]['value'];

export const isFoodType = (value: unknown): value is FoodType =>
  FOOD_TYPES.some((option) => option.value === value);

export const isFavoriteCuisine = (value: unknown): value is FavoriteCuisine =>
  FAVORITE_CUISINES.some((cuisine) => cuisine === value);

export const isSpicePreference = (value: unknown): value is SpicePreference =>
  SPICE_PREFERENCES.some((option) => option.value === value);
