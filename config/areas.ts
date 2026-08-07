// PRD §8: cluster boundaries. Map the real clusters before P10-5.
export const AREAS = ['Kakatiya', 'Vidyaranyapuri', 'Hunter Road'] as const; // PLACEHOLDER
export type Area = (typeof AREAS)[number];
