// PRD §5.7. Change these, not the call sites.
export const BOOKING = {
  minLeadTimeMinutes: 60,
  reminderWindowMinutes: 30,
  tightenedReminderWindowMinutes: 10,
  noShowThreshold: 3, // PLACEHOLDER — decide before P6-10
  // How long after booking_time the visit is considered over and the booking
  // completes (unlocking the review). Not in the PRD; see docs/decisions.md.
  completionGraceMinutes: 120,
} as const;
