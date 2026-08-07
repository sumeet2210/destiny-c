import { describe, expect, it } from 'vitest';
import { formatDistance, haversineKm } from './distance';

describe('haversineKm', () => {
  it('zero for identical points', () => {
    expect(haversineKm(17.98, 79.53, 17.98, 79.53)).toBe(0);
  });

  it('NITW main gate to Warangal station is roughly 12km straight-line', () => {
    const km = haversineKm(17.9837, 79.5308, 17.9784, 79.6009);
    expect(km).toBeGreaterThan(6);
    expect(km).toBeLessThan(9);
  });

  it('is symmetric', () => {
    const a = haversineKm(17.98, 79.53, 18.01, 79.56);
    const b = haversineKm(18.01, 79.56, 17.98, 79.53);
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('formatDistance', () => {
  it('metres under 1km, rounded to 10m', () => {
    expect(formatDistance(0.647)).toBe('650 m');
  });

  it('one-decimal km above 1km', () => {
    expect(formatDistance(2.44)).toBe('2.4 km');
  });
});
