import type {
  BudgetChoice,
  FoodChoice,
  GroupSize,
  MatchAnswers,
  PriorityChoice,
  VibeChoice,
} from '@/config/quiz';

export type MatchableRestaurant = {
  id: string;
  price_per_head: number | null;
  is_veg_only: boolean;
  dine_in: boolean;
  takeaway: boolean;
  student_discount: boolean;
  vibe_tags: string[];
  cravingTags: string[];
  isOpen: boolean;
  rating: number | null;
  trendingViews: number;
  liveOffer: unknown | null;
};

export type RestaurantMatch<T extends MatchableRestaurant> = {
  restaurant: T;
  score: number;
  reasons: string[];
};

const FOOD_LABELS: Record<Exclude<FoodChoice, 'surprise'>, string> = {
  biryani: 'Biryani is on the menu',
  momos: 'Momos are on the menu',
  dosa: 'Dosa is on the menu',
  chai: 'Good for chai and a light bite',
  icecream: 'Dessert is covered',
};

const VIBE_LABELS: Record<VibeChoice, string> = {
  quick: 'Made for a quick stop',
  chill: 'Relaxed atmosphere',
  study: 'Works for a study session',
  date: 'Fits a date plan',
  celebration: 'Lively enough to celebrate',
  latenight: 'Fits a late-night plan',
};

const GROUP_VIBES: Record<GroupSize, string[]> = {
  solo: ['quick', 'study', 'chill'],
  two: ['date', 'chill', 'comfort'],
  small: ['group', 'chill', 'celebration'],
  large: ['group', 'celebration'],
};

function budgetFit(price: number | null, choice: BudgetChoice) {
  if (choice === 'flexible') return { score: 1, fits: false };
  if (price === null) return { score: 0, fits: false };

  const exact =
    (choice === 'under100' && price <= 100) ||
    (choice === '100to200' && price >= 100 && price <= 200) ||
    (choice === '200to400' && price > 200 && price <= 400);
  if (exact) return { score: 6, fits: true };

  const nearby =
    (choice === 'under100' && price <= 150) ||
    (choice === '100to200' && price >= 70 && price <= 260) ||
    (choice === '200to400' && price >= 150 && price <= 450);
  return { score: nearby ? 2 : 0, fits: false };
}

function priorityFit<T extends MatchableRestaurant>(
  restaurant: T,
  priority: PriorityChoice,
) {
  switch (priority) {
    case 'open':
      return restaurant.isOpen
        ? { score: 5, reason: 'Open right now' }
        : { score: 0 };
    case 'offer':
      return restaurant.liveOffer
        ? { score: 5, reason: 'Has a live offer' }
        : { score: 0 };
    case 'discount':
      return restaurant.student_discount
        ? { score: 5, reason: 'Student discount available' }
        : { score: 0 };
    case 'veg':
      return restaurant.is_veg_only
        ? { score: 7, reason: 'Pure vegetarian kitchen' }
        : { score: 0 };
    case 'none':
      return { score: 0 };
  }
}

/**
 * Ranks every restaurant instead of strictly filtering. A close alternative is
 * still useful when no place satisfies every preference in a small catalog.
 */
export function rankRestaurantMatches<T extends MatchableRestaurant>(
  restaurants: T[],
  answers: MatchAnswers,
): RestaurantMatch<T>[] {
  return restaurants
    .map((restaurant) => {
      let score = 0;
      const reasons: string[] = [];
      const budget = budgetFit(restaurant.price_per_head, answers.budget);
      score += budget.score;
      if (budget.fits && restaurant.price_per_head !== null) {
        reasons.push(`Around ₹${restaurant.price_per_head} per person`);
      }

      if (
        answers.food !== 'surprise' &&
        restaurant.cravingTags.includes(answers.food)
      ) {
        score += 8;
        reasons.push(FOOD_LABELS[answers.food]);
      }

      if (restaurant.vibe_tags.includes(answers.vibe)) {
        score += 6;
        reasons.push(VIBE_LABELS[answers.vibe]);
      }

      const groupVibeMatches = GROUP_VIBES[answers.groupSize].filter((tag) =>
        restaurant.vibe_tags.includes(tag),
      ).length;
      score += Math.min(groupVibeMatches, 2) * 2;

      if (answers.groupSize === 'large' && restaurant.dine_in) {
        score += 3;
        reasons.push('Dine-in works for the group');
      } else if (answers.groupSize === 'solo' && restaurant.takeaway) {
        score += 1;
      }

      const priority = priorityFit(restaurant, answers.priority);
      score += priority.score;
      // The user's explicit practical constraint should remain visible even
      // when food, budget, and vibe all match as well.
      if (priority.reason) reasons.unshift(priority.reason);

      // Small, honest tie-breakers keep equal preference scores deterministic.
      score += (restaurant.rating ?? 0) / 20;
      score += Math.min(restaurant.trendingViews, 100) / 1000;

      if (reasons.length === 0) {
        reasons.push('Strongest overall fit from the current shortlist');
      }

      return { restaurant, score, reasons: reasons.slice(0, 3) };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.restaurant.trendingViews - a.restaurant.trendingViews ||
        a.restaurant.id.localeCompare(b.restaurant.id),
    );
}
