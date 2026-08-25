import { describe, expect, it } from 'vitest';
import {
  normalizeIndianPhone,
  profileMissingFields,
  validateRestaurantApplication,
} from './domain';

const valid = {
  restaurantName: 'Campus Kitchen',
  ownerName: 'Asha Rao',
  phone: '9876543210',
  email: 'owner@example.com',
  restaurantAddress: '1 Main Road, Warangal',
};

describe('restaurant onboarding validation', () => {
  it('normalizes valid Indian phone numbers', () => {
    expect(normalizeIndianPhone('98765 43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('+91-98765-43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('123')).toBeNull();
  });

  it('accepts a complete application', () => {
    const result = validateRestaurantApplication(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.phone).toBe('+919876543210');
  });

  it('returns useful field errors', () => {
    const result = validateRestaurantApplication({
      ...valid,
      email: 'wrong',
      restaurantAddress: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toMatch(/valid email/i);
      expect(result.errors.restaurantAddress).toMatch(/address/i);
    }
  });

  it('requires operational profile content before review', () => {
    expect(profileMissingFields({ menuCount: 0, photoCount: 0 })).toContain(
      'at least one menu item',
    );
  });
});
