import { describe, expect, it } from 'vitest';
import { averageRating } from './reviews';

describe('averageRating', () => {
  it('returns null with no reviews so the UI can show an empty state', () => {
    expect(averageRating([])).toBeNull();
  });

  it('returns the single rating unchanged', () => {
    expect(averageRating([4])).toBe(4);
  });

  it('averages a whole-number result', () => {
    expect(averageRating([5, 3])).toBe(4);
  });

  it('averages to a fraction without rounding early', () => {
    expect(averageRating([5, 4])).toBe(4.5);
    expect(averageRating([5, 4, 4])).toBeCloseTo(4.333333, 5);
  });

  it('handles the rating bounds', () => {
    expect(averageRating([1, 1, 1])).toBe(1);
    expect(averageRating([5, 5, 5])).toBe(5);
  });

  it('does not depend on order', () => {
    expect(averageRating([1, 5, 3])).toBe(averageRating([3, 1, 5]));
  });

  it('matches the arithmetic the public restaurant cards use', () => {
    const ratings = [5, 4, 3, 5, 2];
    expect(averageRating(ratings)).toBe(
      ratings.reduce((a, b) => a + b, 0) / ratings.length,
    );
  });
});
