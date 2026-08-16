// PRD §5.6. Must stay in sync with the Postgres event_type enum — changing this
// list requires a migration. Decide before P5-9.
export const EVENT_TYPES = [
  { key: 'live_music', label: 'Live music' },
  { key: 'open_mic', label: 'Open mic' },
  { key: 'quiz', label: 'Quiz night' },
  { key: 'screening', label: 'Screening' },
  { key: 'food_festival', label: 'Food festival' },
  { key: 'other', label: 'Other' },
] as const;
export type EventTypeKey = (typeof EVENT_TYPES)[number]['key'];
