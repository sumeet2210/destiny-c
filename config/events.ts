// PRD §5.6. Must stay in sync with the Postgres event_type enum — changing this
// list requires a migration. Decide before P5-9.
export const EVENT_TYPES = [
  { key: 'live_music', label: 'Live music', emoji: '🎸' },
  { key: 'open_mic', label: 'Open mic', emoji: '🎤' },
  { key: 'quiz', label: 'Quiz night', emoji: '🧠' },
  { key: 'screening', label: 'Screening', emoji: '🎬' },
  { key: 'food_festival', label: 'Food festival', emoji: '🎪' },
  { key: 'other', label: 'Other', emoji: '📌' },
] as const;
export type EventTypeKey = (typeof EVENT_TYPES)[number]['key'];
