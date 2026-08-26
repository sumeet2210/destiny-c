// PRD §5.3. Why you're going — orthogonal to cravings. Decide before P3-8.
// Keep the stored `study` tag for existing discovery matches while showing the
// broader "Work" label requested by the profile UI.
export const VIBES = [
  { tag: 'chill', label: 'Chill' },
  { tag: 'group', label: 'Group Hangout' },
  { tag: 'date', label: 'Date' },
  { tag: 'latenight', label: 'Late Night' },
  { tag: 'quick', label: 'Quick Bite' },
  { tag: 'comfort', label: 'Comfort Food' },
  { tag: 'celebration', label: 'Celebration' },
  { tag: 'study', label: 'Work' },
  { tag: 'family', label: 'Family' },
] as const;
export type VibeTag = (typeof VIBES)[number]['tag'];
