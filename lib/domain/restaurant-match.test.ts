import { describe, expect, it } from 'vitest';
import type { MatchAnswers } from '@/config/quiz';
import {
  rankRestaurantMatches,
  type MatchableRestaurant,
} from './restaurant-match';

const base: MatchableRestaurant = {
  id: 'base',
  price_per_head: 180,
  is_veg_only: false,
  dine_in: true,
  takeaway: true,
  student_discount: false,
  vibe_tags: [],
  cravingTags: [],
  isOpen: true,
  rating: 4,
  trendingViews: 10,
  liveOffer: null,
};

const answers: MatchAnswers = {
  groupSize: 'small',
  budget: '100to200',
  food: 'biryani',
  vibe: 'celebration',
  priority: 'discount',
};

describe('rankRestaurantMatches', () => {
  it('puts a restaurant matching the main preferences first', () => {
    const exact = {
      ...base,
      id: 'exact',
      student_discount: true,
      vibe_tags: ['celebration', 'group'],
      cravingTags: ['biryani'],
    };
    const partial = { ...base, id: 'partial', cravingTags: ['momos'] };

    const ranked = rankRestaurantMatches([partial, exact], answers);

    expect(ranked[0].restaurant.id).toBe('exact');
    expect(ranked[0].reasons).toContain('Biryani is on the menu');
    expect(ranked[0].reasons).toContain('Student discount available');
  });

  it('ranks every option so a small catalog never returns an empty result', () => {
    const ranked = rankRestaurantMatches(
      [{ ...base, id: 'fallback', isOpen: false }],
      { ...answers, budget: 'under100', food: 'dosa', priority: 'open' },
    );

    expect(ranked).toHaveLength(1);
    expect(ranked[0].reasons).toEqual([
      'Strongest overall fit from the current shortlist',
    ]);
  });

  it('uses group size to favour dine-in celebration spots for larger groups', () => {
    const groupSpot = {
      ...base,
      id: 'group',
      vibe_tags: ['group', 'celebration'],
    };
    const quickSpot = {
      ...base,
      id: 'quick',
      dine_in: false,
      vibe_tags: ['quick'],
    };

    const ranked = rankRestaurantMatches([quickSpot, groupSpot], {
      ...answers,
      groupSize: 'large',
      food: 'surprise',
      vibe: 'latenight',
      priority: 'none',
    });

    expect(ranked[0].restaurant.id).toBe('group');
    expect(ranked[0].reasons).toContain('Dine-in works for the group');
  });
});
