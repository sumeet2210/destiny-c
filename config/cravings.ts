// PRD §5.3. What you want to eat. Extend freely — not load-bearing.
export const CRAVINGS = [
  { tag: 'biryani', label: 'Biryani' },
  { tag: 'momos', label: 'Momos' },
  { tag: 'chai', label: 'Chai' },
  { tag: 'icecream', label: 'Ice cream' },
  { tag: 'dosa', label: 'Dosa' },
  { tag: 'burger', label: 'Burger' },
  { tag: 'pizza', label: 'Pizza' },
  { tag: 'shawarma', label: 'Shawarma' },
  { tag: 'juice', label: 'Juice' },
  { tag: 'sweets', label: 'Sweets' },
] as const;
export type CravingTag = (typeof CRAVINGS)[number]['tag'];
