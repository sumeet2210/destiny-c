---
name: design-system
description: Use whenever building or editing UI components, pages, or styles for the NITW food platform — colors, typography, spacing, or component look-and-feel. Triggers on any task touching .tsx components, Tailwind classes, or visual layout.
---

# Design System

Full rationale lives in `/docs/design.md`. This is the enforceable summary — apply these tokens exactly, don't introduce new ones without updating `design.md` first.

**Dark is the default and only theme in v1.** Don't add a light-mode toggle.

## Colors (Tailwind config keys)

- `canvas`: #14161F — page background, nothing else is this dark
- `surface-muted`: #1D2029 — cards, ticker rail, filter board, inputs
- `surface-raised`: #262A36 — nested inside a card (chip rests, rows in a card, modal body)
- `border-hairline`: #2E3340 — dividers and outlines, solid not alpha
- `paper`: #F3EEE2 — primary text (warm off-white, never pure white)
- `text-muted`: #A29B96 — secondary text, metadata, placeholders
- `accent-primary`: #FFC229 (turmeric) — CTAs, active chip/tab state, price emphasis, focus rings. Text on it is #14110F.
- `accent-secondary`: #6FBF8B (mint) — veg tag, "open now", positive confirmation
- `accent-urgent`: #E8432B (chili) — **only** for time-bound urgency (offer expiry countdown, closing soon). Never decorative. As text on `canvas` use #F2604B instead, for contrast.

Three surface levels only. Anything that needs to sit above `surface-raised` is a modal.

## Typography

- Display/headings: Roboto Slab, 700/800
- Body: Inter, 400/500/700
- Prices, countdowns, headcounts, ratings, any tabular/numeric data: monospace (JetBrains Mono or Space Mono) — never render a comparable number in the body font
- 11px is the minimum size

## Component rules

- No drop shadows on cards — separation comes from `surface-muted` vs `canvas`. Shadows are allowed only on modals and dropdown popovers.
- No gradients, with one exception: the legibility scrim over hero and cover photography. No gradient text, no gradient buttons.
- Chips: pill shape, `surface-raised` + hairline border at rest, filled `accent-primary` + #14110F text when active. One active state, one color — no mood/group color variants.
- Menu rows: `name` left, dotted leader, `price` right in monospace, veg square before the name — deliberate receipt-style pattern, don't collapse it into a generic flex row without the leader.
- Radii: chips 999px, cards/modals 14px, inputs/buttons/tabs 12px, deal tags `6px 6px 6px 0`.
- The craving-chip row on the homepage is the signature interactive element — preserve the horizontal-scroll chip → swipeable card-stack interaction, don't simplify it into a dropdown or generic filter unless explicitly told to.

## Motion

Four approved moments: hero entrance fade-up (first load only), chip-tap → card-stack reveal, card swipe, ticker drag-to-scroll. No scroll-triggered reveals, no hover parallax, no ticker auto-scroll, no hover-translate on cards and chips, no ambient/idle animation. Respect `prefers-reduced-motion` on all four.

## Accessibility floor

Every interactive element needs a visible keyboard focus state. Check `paper`-on-`canvas`, `text-muted`-on-`surface-muted`, and `accent-primary` combinations against WCAG AA. Veg/non-veg is never color alone — outline plus filled dot. Build mobile-first and test on a real mid-range Android — this is used on phones between classes.
