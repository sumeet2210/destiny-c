// PRD §5.9. Port of the Next app's config/social.ts. Sharing is OFF by default
// and that default is a privacy decision — bookings are never shared.
export const SOCIAL = {
  shareActivityDefault: false,
  maxFriends: 150,
  sharedSignals: ['saved', 'event_rsvp'],
};
