// PRD §5.9. Sharing is OFF by default and that default is a privacy decision,
// not a preference — don't flip it without a decisions.md entry.
export const SOCIAL = {
  shareActivityDefault: false,
  maxFriends: 150, // PLACEHOLDER — decide before P9-2
  sharedSignals: ['saved', 'event_rsvp'] as const, // bookings are never shared
} as const;
