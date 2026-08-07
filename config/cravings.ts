// PRD §5.3. What you want to eat. Extend freely — not load-bearing.
export const CRAVINGS = [
  { tag: 'biryani', label: 'Biryani', emoji: '🍛' },
  { tag: 'momos', label: 'Momos', emoji: '🥟' },
  { tag: 'chai', label: 'Chai', emoji: '☕' },
  { tag: 'icecream', label: 'Ice cream', emoji: '🍦' },
  { tag: 'dosa', label: 'Dosa', emoji: '🥞' },
  { tag: 'burger', label: 'Burger', emoji: '🍔' },
  { tag: 'pizza', label: 'Pizza', emoji: '🍕' },
  { tag: 'shawarma', label: 'Shawarma', emoji: '🌯' },
  { tag: 'juice', label: 'Juice', emoji: '🥤' },
  { tag: 'sweets', label: 'Sweets', emoji: '🍮' },
] as const;
export type CravingTag = (typeof CRAVINGS)[number]['tag'];
