# Destiny Design System

This document records the approved visual direction from `final-prototype` and the supplied Destiny brand palette. It supersedes the former dark-default system as the target for the production redesign.

## Migration status

The redesign is intentionally staged. The public homepage (`/`) is the first converted surface. Every other route keeps its existing presentation until it is reviewed and migrated separately. During migration, preserve all data queries, permissions, actions, analytics sources, and route behavior; only presentation may change.

## Brand palette

Use only these colors. Transparency is allowed when it is a tint of one of them.

| Token          | Hex       | Role                                              |
| -------------- | --------- | ------------------------------------------------- |
| Destiny Teal   | `#00B89C` | Primary actions, active states, key brand moments |
| Destiny Black  | `#000000` | Primary text, dark fields, icons                  |
| Pure White     | `#FFFFFF` | Cards, inverted text, clean surfaces              |
| Soft Off-White | `#F8FAFA` | Main canvas and light backgrounds                 |
| Dark Teal      | `#008F7A` | Secondary emphasis and non-text accents           |
| Light Teal     | `#25CBB5` | Highlights and supporting accents                 |
| Mint Light     | `#E6FAF6` | Subtle backgrounds and soft sections              |
| Stone Gray     | `#4B5563` | Secondary text and disabled states                |

Black or Destiny Teal may form large section fields. On Destiny Teal, use black text. On black, use Pure White, Mint Light, or Light Teal according to contrast needs. Do not introduce unrelated accent colors.

## Identity

- Use the supplied full Destiny wordmark at `public/brand/destiny-wordmark.png`.
- Keep the full wordmark in the desktop and mobile header; do not replace it with a letter or pin-only mark.
- Preserve the logo proportions and crop only the excess source canvas, never the mark itself.
- Use black-and-teal artwork on light surfaces. Reserve glow or decorative pin artwork for campaign imagery, not navigation.

## Typography

Manrope is the homepage family for display and body text. Use compact, editorial display settings and highly legible body settings.

- Hero display: weight 500–600, tight tracking, balanced line breaks.
- Section titles: weight 550–650, tight tracking.
- Body: weight 400–500, line height 1.5 or greater.
- Controls and metadata: weight 650–750; avoid text smaller than 12px.
- Numeric content may keep the established mono font where aligned comparison matters.

## Layout and surfaces

The homepage should help someone make a dinner decision quickly, not resemble an endless marketplace feed.

- Use a two-column editorial hero on desktop and an image-backed hero on phones.
- Keep primary content within a maximum width of 100rem.
- Alternate Soft Off-White, black, Mint Light, and white fields to create hierarchy.
- Use rounded surfaces with restrained borders; cards do not need heavy shadows.
- Keep content shortlists compact. The homepage shows a small popular selection while `/search` remains the complete catalog.
- Do not promote the current campus limitation in headline copy. Location may appear as quiet context only.

## Homepage composition

1. Full wordmark navigation with all existing destinations.
2. Decision-led hero with the existing search and quiz routes.
3. Today’s specials rail using live offer data.
4. Craving picker with its existing swipe/pass/open behavior.
5. Upcoming event preview using live event data.
6. Conditional squad activity using the existing auth and friend logic.
7. A compact three-place popular shortlist with saves, friend notes, and analytics preserved.
8. Minimal brand footer and back-to-top action.

Restaurant cards on the homepage must remain compact. A single restaurant must not consume the full viewport. Use a dense horizontal composition on phones and a bounded grid on larger screens.

## Interaction

- Keep the established routes and action semantics unchanged.
- Every tappable control must provide at least a 44 by 44px target on touch layouts.
- Every migrated page must remain usable at 320px wide without horizontal page overflow.
- Use solid color changes, borders, and focus rings for feedback.
- Motion should support the hero entrance, craving reveal/swipe, and the slow continuous offer ticker. The ticker pauses for hover, focus, dragging, an off-screen rail, a hidden tab, and reduced-motion preferences.
- Honor `prefers-reduced-motion`.

## Accessibility

- Provide a visible keyboard focus treatment for every interactive element.
- Meet WCAG AA contrast for body and control text.
- Never use color as the only status signal.
- Maintain meaningful landmark, heading, and link structure.
- Decorative food imagery uses empty alternative text; meaningful identity artwork uses `Destiny`.
- Verify desktop and phone layouts after each migrated surface.

## Migration rule

The final prototype is the visual source of truth, while the current production code is the behavioral source of truth. If a visual adaptation risks changing a feature, preserve the feature and adjust the layout around it. Migrate the remaining routes only after the homepage is reviewed and approved.
