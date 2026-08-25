export type ApplicationStatus =
  'pending' | 'approved' | 'rejected' | 'more_info_required';

export type RestaurantApplicationInput = {
  restaurantName: string;
  ownerName: string;
  phone: string;
  email: string;
  restaurantAddress: string;
};

export type ApplicationErrors = Partial<
  Record<keyof RestaurantApplicationInput, string>
>;

export function normalizeIndianPhone(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, '');
  const digits = compact.startsWith('+91') ? compact.slice(3) : compact;
  return /^\d{10}$/.test(digits) ? `+91${digits}` : null;
}

export function validateRestaurantApplication(
  input: RestaurantApplicationInput,
) {
  const values = {
    restaurantName: input.restaurantName.trim(),
    ownerName: input.ownerName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    restaurantAddress: input.restaurantAddress.trim(),
  };
  const errors: ApplicationErrors = {};

  if (values.restaurantName.length < 2)
    errors.restaurantName = 'Enter the restaurant name.';
  else if (values.restaurantName.length > 120)
    errors.restaurantName = 'Restaurant name must be 120 characters or less.';

  if (values.ownerName.length < 2) errors.ownerName = 'Enter the owner name.';
  else if (values.ownerName.length > 120)
    errors.ownerName = 'Owner name must be 120 characters or less.';

  const phone = normalizeIndianPhone(values.phone);
  if (!phone) errors.phone = 'Enter a valid 10-digit Indian phone number.';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'Enter a valid email address.';

  if (values.restaurantAddress.length < 8)
    errors.restaurantAddress = 'Enter the complete restaurant address.';
  else if (values.restaurantAddress.length > 500)
    errors.restaurantAddress = 'Address must be 500 characters or less.';

  if (Object.keys(errors).length > 0) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: { ...values, phone: phone! },
  };
}

export function profileMissingFields(input: {
  name?: string | null;
  owner_name?: string | null;
  description?: string | null;
  restaurant_category?: string | null;
  cuisines?: string[] | null;
  phone?: string | null;
  area?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  opening_hours?: unknown;
  menuCount: number;
  photoCount: number;
}): string[] {
  const missing: string[] = [];
  if (!input.name?.trim()) missing.push('restaurant name');
  if (!input.owner_name?.trim()) missing.push('owner name');
  if (!input.description?.trim()) missing.push('description');
  if (!input.restaurant_category?.trim()) missing.push('category');
  if (!input.cuisines?.length) missing.push('cuisine');
  if (!input.phone || !/^\+91\d{10}$/.test(input.phone)) missing.push('phone');
  if (!input.area?.trim()) missing.push('area/locality');
  if (!input.address?.trim()) missing.push('full address');
  if (input.lat == null || input.lng == null) missing.push('map location');
  if (!input.opening_hours) missing.push('opening hours');
  if (input.menuCount < 1) missing.push('at least one menu item');
  if (input.photoCount < 1) missing.push('at least one restaurant photo');
  return missing;
}
