export type GroupSize = 'solo' | 'two' | 'small' | 'large';
export type BudgetChoice = 'under100' | '100to200' | '200to400' | 'flexible';
export type FoodChoice =
  'biryani' | 'momos' | 'dosa' | 'chai' | 'icecream' | 'surprise';
export type VibeChoice =
  'quick' | 'chill' | 'study' | 'date' | 'celebration' | 'latenight';
export type PriorityChoice = 'open' | 'offer' | 'discount' | 'veg' | 'none';

export type MatchAnswers = {
  groupSize: GroupSize;
  budget: BudgetChoice;
  food: FoodChoice;
  vibe: VibeChoice;
  priority: PriorityChoice;
};

type MatchQuestion = {
  id: keyof MatchAnswers;
  question: string;
  help: string;
  options: { label: string; detail: string; value: string }[];
};

export const MATCH_QUESTIONS: MatchQuestion[] = [
  {
    id: 'groupSize',
    question: 'How many seats do you need?',
    help: 'This helps us balance quick stops with places that work for a group.',
    options: [
      { label: 'Just me', detail: 'A solo food run', value: 'solo' },
      { label: 'Two people', detail: 'A catch-up or date', value: 'two' },
      { label: '3–5 people', detail: 'A small group plan', value: 'small' },
      {
        label: '6 or more',
        detail: 'Space for the whole squad',
        value: 'large',
      },
    ],
  },
  {
    id: 'budget',
    question: 'What feels right per person?',
    help: 'We use the usual spend at each restaurant, not the cheapest menu item.',
    options: [
      {
        label: 'Under ₹100',
        detail: 'Keep it pocket-friendly',
        value: 'under100',
      },
      { label: '₹100–200', detail: 'A regular meal', value: '100to200' },
      {
        label: '₹200–400',
        detail: 'Room for something extra',
        value: '200to400',
      },
      {
        label: 'Flexible',
        detail: 'Show the strongest match',
        value: 'flexible',
      },
    ],
  },
  {
    id: 'food',
    question: 'What do you want to eat?',
    help: 'Pick the craving that would settle the decision fastest.',
    options: [
      { label: 'Biryani', detail: 'A proper, filling meal', value: 'biryani' },
      { label: 'Momos', detail: 'Steamed, fried, or spicy', value: 'momos' },
      { label: 'Dosa', detail: 'South Indian comfort', value: 'dosa' },
      { label: 'Chai & snacks', detail: 'Something light', value: 'chai' },
      {
        label: 'Dessert',
        detail: 'Ice cream or something sweet',
        value: 'icecream',
      },
      {
        label: 'Surprise me',
        detail: 'Let the other answers decide',
        value: 'surprise',
      },
    ],
  },
  {
    id: 'vibe',
    question: 'What should the place feel like?',
    help: 'We match this against the atmosphere restaurants are known for.',
    options: [
      { label: 'Quick stop', detail: 'Eat and get moving', value: 'quick' },
      { label: 'Relaxed', detail: 'Stay and talk', value: 'chill' },
      {
        label: 'Study-friendly',
        detail: 'Calmer and easy to settle into',
        value: 'study',
      },
      { label: 'Date night', detail: 'A little more special', value: 'date' },
      {
        label: 'Celebration',
        detail: 'Lively enough for an occasion',
        value: 'celebration',
      },
      {
        label: 'Late-night',
        detail: 'For plans that run longer',
        value: 'latenight',
      },
    ],
  },
  {
    id: 'priority',
    question: 'Anything we should prioritise?',
    help: 'Choose the one practical detail that matters most right now.',
    options: [
      { label: 'Open now', detail: 'Avoid a wasted walk', value: 'open' },
      {
        label: 'A live offer',
        detail: 'Make the budget go further',
        value: 'offer',
      },
      {
        label: 'Student discount',
        detail: 'Prefer verified student savings',
        value: 'discount',
      },
      { label: 'Pure vegetarian', detail: 'Only veg kitchens', value: 'veg' },
      {
        label: 'No preference',
        detail: 'Use the overall match',
        value: 'none',
      },
    ],
  },
];
