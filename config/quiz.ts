// PRD §5.3. Pure client-side; answers resolve to a filter set. Decide before P3-9.
// Each option maps to search-page query params; the quiz never persists anything.
export type QuizFilterPatch = {
  vibe?: string;
  price?: string;
  veg?: 'veg';
  craving?: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: { label: string; emoji: string; patch: QuizFilterPatch }[];
};

export const QUIZ: QuizQuestion[] = [
  {
    id: 'vibe',
    question: "What's the plan?",
    options: [
      { label: 'Just chilling', emoji: '😌', patch: { vibe: 'chill' } },
      { label: 'Study session', emoji: '📚', patch: { vibe: 'study' } },
      { label: 'Squad hangout', emoji: '👯', patch: { vibe: 'group' } },
      { label: 'A date', emoji: '💛', patch: { vibe: 'date' } },
    ],
  },
  {
    id: 'budget',
    question: 'Budget per head?',
    options: [
      { label: 'Under ₹100', emoji: '🪙', patch: { price: 'under100' } },
      { label: '₹100–200', emoji: '💵', patch: { price: '100to200' } },
      { label: '₹200–400', emoji: '💳', patch: { price: '200to400' } },
      { label: 'Sky is the limit', emoji: '🚀', patch: { price: '400plus' } },
    ],
  },
  {
    id: 'hunger',
    question: 'How hungry are we talking?',
    options: [
      { label: 'Just chai + snacks', emoji: '☕', patch: { craving: 'chai' } },
      { label: 'Proper meal', emoji: '🍛', patch: { craving: 'biryani' } },
      { label: 'Something sweet', emoji: '🍦', patch: { craving: 'icecream' } },
      { label: 'Anything veg', emoji: '🥗', patch: { veg: 'veg' } },
    ],
  },
];
