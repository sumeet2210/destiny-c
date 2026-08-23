// PRD §5.7. Port of the Next app's config/booking.ts — change these, not the
// call sites. Kept in sync with lib/domain/booking.js.
export const BOOKING = {
  minLeadTimeMinutes: 60,
  reminderWindowMinutes: 30,
  tightenedReminderWindowMinutes: 10,
  noShowThreshold: 3,
  completionGraceMinutes: 120,
};
