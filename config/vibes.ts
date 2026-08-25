// PRD §5.3. Why you're going — orthogonal to cravings. Decide before P3-8.
// The full PRD list is eight vibes; SETUP.md's six-item placeholder was stale.
export const VIBES = [
  { tag: 'chill', label: 'Chill' },
  { tag: 'group', label: 'Group hangout' },
  { tag: 'date', label: 'Date' },
  { tag: 'latenight', label: 'Late night' },
  { tag: 'quick', label: 'Quick bite' },
  { tag: 'comfort', label: 'Comfort food' },
  { tag: 'celebration', label: 'Celebration' },
  { tag: 'work', label: 'Work' },
  { tag: 'family', label: 'Family' },
] as const;
export type VibeTag = (typeof VIBES)[number]['tag'];
