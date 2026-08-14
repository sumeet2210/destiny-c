---
version: 1
slug: 'app-public-events-page-tsx'
primary_target: 'app/(public)/events/page.tsx'
related_targets:
  [
    'app/(public)/events/events.module.css',
    'components/features/RsvpButton.tsx',
  ]
---

# Events page redesign

- Scope: production route `/events`; visitor mode is Operate with an editorial event agenda.
- Audience and job: students deciding which nearby event to attend and which restaurant hosts it.
- Primary actions: inspect the schedule, open the restaurant, RSVP, or sign in through the existing RSVP gate.
- Required evidence: event type, IST date and time, title, host restaurant, description, personal RSVP state, and friend-going signals.
- Constraints: preserve metadata, the four parallel data reads, chronological catalog filtering, restaurant destinations, student-only RSVP behavior, optimistic updates, login redirect, and empty/loading states.
- Direction: extend the light Destiny world with a spacious off-white introduction, a black calendar field, alternating image-led white event bands, mint date/type signals, flat controls, and Manrope throughout.
- Artwork rule: prefer a real non-seed event cover; otherwise use the curated restaurant artwork map, then the shared campus-feast image as the final fallback.
- State treatment: loading keeps the black agenda and three image/copy skeleton bands; the empty state becomes a black calendar panel with a “Browse restaurants” route back to `/search`.
- Memorable moment: the black agenda opens into large venue imagery and oversized calendar dates, making the page feel like a compact campus culture guide rather than a generic list.
- Responsive and density rule: keep event bands compact with a 21rem desktop card/media floor, fluid title scales that remain active up to 3.1rem desktop and 2.35rem mobile, compact descriptions (0.76rem/1.45), tighter padding and gaps, no truncation, and content-driven expansion; below 704px, stack imagery above copy with a shallow responsive media height (`clamp(11rem, 50vw, 14rem)`), turn the circular calendar jump into a full-width rounded bar, retain 44px actions, wrap friend signals, respect reduced motion, and prevent horizontal overflow at 320px.
- Event action structure: keep each event title and RSVP control in one responsive row, with the RSVP rail bounded between 7.25rem and 9rem and friend-going copy wrapping inside that rail at narrow widths. Mirror this title/action row in loading skeletons. The linked restaurant name is the sole venue navigation affordance; do not restore a duplicate lower restaurant CTA.

## Direction contract

- INTENT: help a student understand what is happening near campus and act without leaving the event context.
- CONTENT: real upcoming-event data, IST timing, event type, host restaurant, description, RSVP state, and friend activity; no fabricated availability or commercial claims.
- FORM: inherit the approved Destiny editorial system as a black event agenda on an off-white canvas, with asymmetric image-led bands, mint calendar signals, flat controls, and authored line icons.
- FIRST VIEWPORT: an oversized “What’s on.” statement and large mint circular calendar jump establish the page before the black agenda begins; the first real event follows immediately.
- INTERACTION: one restrained field reveal, photographic zoom on event hover, a circle-to-soft-square color inversion on the calendar jump, and a small diagonal venue-arrow nudge; visible inherited focus, 44px actions, and a motion-free reduced-motion mode remain mandatory.
- Provenance: no new FORM seed or comp was introduced because the user explicitly requested the current approved theme; this is a code-led extension of the existing `/search` and `/restaurant/[id]` world.
