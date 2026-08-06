# Design System — v2 (dark default)

Supersedes the light system. Decision recorded in `decisions.md` on 2026-08-05.

**What changed and why:** the light system was written before anything was built. The
`destiny-food-app` prototype is the version people have actually reacted to, and it's dark.
Rather than throw either away, this keeps the prototype's shell — dark surfaces, warm
off-white text, card anatomy, radii — and keeps the light system's discipline about what
each colour is allowed to mean. The old system's failure mode was that it looked generic.
The prototype's failure mode was that every accent colour fired at once, so none of them
signalled anything. This fixes both.

---

## 1. Colour

Dark is the default and only theme in v1. Don't build a light-mode toggle — it doubles the
QA surface for a product used mostly at night.

### Surfaces

| Token             | Hex       | Use                                                                     |
| ----------------- | --------- | ----------------------------------------------------------------------- |
| `canvas`          | `#14161F` | Page background. Nothing else is this dark.                             |
| `surface-muted`   | `#1D2029` | Cards, the ticker rail, filter board, inputs.                           |
| `surface-raised`  | `#262A36` | Nested inside a card — chip rests, list rows inside a card, modal body. |
| `border-hairline` | `#2E3340` | All dividers and outlines. Solid, not alpha.                            |

Three surface levels, no more. If something needs to sit above `surface-raised`, it's a
modal, and modals get a scrim, not a fourth colour.

### Text

| Token        | Hex       | Use                                                                                                     |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------- |
| `paper`      | `#F3EEE2` | Primary text. Warm off-white, not pure white — pure white on a dark canvas is harsh over a long scroll. |
| `text-muted` | `#A29B96` | Secondary text, metadata, placeholders.                                                                 |

`#A29B96` is lifted from the prototype's `#948D8A`, which sat at 4.1:1 on canvas and failed
AA for body copy. Don't take it back down.

### Accents

| Token                | Hex                | Allowed use                                                     | Text on top |
| -------------------- | ------------------ | --------------------------------------------------------------- | ----------- |
| `accent-primary`     | `#FFC229` turmeric | CTAs, active chip and tab state, price emphasis, focus ring     | `#14110F`   |
| `accent-secondary`   | `#6FBF8B` mint     | Veg indicator, "open now", positive confirmation                | `#0F1F17`   |
| `accent-urgent`      | `#E8432B` chili    | **Only** offer-expiry countdowns and "closing soon"             | `#F3EEE2`   |
| `accent-urgent-text` | `#F2604B`          | The same meaning, when it's text on `canvas` rather than a fill | —           |

Turmeric replaces the prototype's marigold `#C1602E`. Marigold is a brownish orange that
sits at 3.4:1 on the canvas — it reads as muddy at 13px and fails AA as text. Turmeric is
the one colour carried over from the light system, and it's the right call: on a dark base
it's the most legible accent available, and it's already the product's identity colour.

Mint replaces curry-leaf green `#3A7D44`, which is unreadable on a dark background. Same
meaning, dark-mode value.

**The urgency rule survives, and it's the most important rule here.** In the prototype,
chili red is on every deal tag, the search box top rule, the event calendar header, and the
active reset button. By the time an offer is genuinely 20 minutes from expiring, the colour
has no signal left. Expiry countdowns and closing-soon are the entire permitted surface. A
deal tag that isn't counting down uses turmeric or a hairline outline.

The prototype's `group-blue #6FA8D8` is dropped along with the group-size filter, which is
a post-v1 filter per PRD §5.3. If group size comes back, it comes back on a hairline chip,
not a fourth accent.

---

## 2. Typography

| Role    | Family                                | Notes                                                                                                                                                                                 |
| ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display | Roboto Slab, 700/800                  | Wordmark, page titles, restaurant names on the profile page. From the prototype — the slab serif is genuinely distinctive against every other food app, which are all geometric sans. |
| Body    | Inter, 400/500/700                    | Everything else.                                                                                                                                                                      |
| Numeric | JetBrains Mono or Space Mono, 400/700 | **All** prices, countdowns, headcounts, analytics figures, ratings.                                                                                                                   |

The monospace rule is carried over from the light system and the prototype does not have it.
Adopt it. Prices in the body font in a right-aligned column don't line up on the decimal and
the eye can't scan them; in a receipt-style menu that's the whole point of the layout. If a
number is a quantity the user compares against another number, it's mono.

Both Roboto Slab and Inter are on Google Fonts — no licence question, unlike Cabinet Grotesk.

Sizes: 11px is the floor. Body 13–14px, card titles 15–18px, page titles 22–28px, display
wordmark up to 68px.

---

## 3. Shape and elevation

| Element                     | Radius                                                              |
| --------------------------- | ------------------------------------------------------------------- |
| Chips, pills, avatars       | `999px`                                                             |
| Cards, filter board, modals | `14px`                                                              |
| Inputs, buttons, tabs       | `12px`                                                              |
| Deal tags                   | `6px 6px 6px 0` — the clipped corner is from the prototype, keep it |

**No shadows on cards.** Depth comes from `surface-muted` sitting on `canvas`. The prototype
puts `0 10px 22px rgba(0,0,0,.35)` on card hover and it does nothing on a dark background
except smear the edge. Shadows are permitted on exactly two things: modals and dropdown
popovers, where the element genuinely floats over content.

**No gradients**, with one exception: the scrim over hero and cover photography, which is
functional — it's what makes overlaid text legible. The prototype's gradient-filled wordmark
and gradient CTA buttons go. A solid turmeric button is more legible and doesn't shimmer
during streaming or on low-end phones.

---

## 4. Components

**Card.** `surface-muted`, 14px radius, 16px padding. Media block bleeds to the edges with
negative margin. Keep the prototype's carousel dots and the save toggle. Keep the dashed
hairline above the footer row — it's a receipt reference and it ties the card to the menu.
Price in the footer is mono, turmeric.

**Chip.** Pill, `surface-raised` fill with a hairline border at rest, turmeric fill with
`#14110F` text when active. Visible focus ring, always. The prototype's mood-variant and
group-variant colours are dropped — one active state, one colour.

**Menu row.** Item name left, dotted leader, mono price right, veg/non-veg square before the
name. This is a deliberate receipt pattern and the prototype does not have it — it hides the
menu behind a "View Menu" button and shows photos. Build the real thing. Don't collapse it
into a flex row without the leader.

**Offer badge.** Turmeric outline at rest. When under an hour from expiry, the countdown
switches to `accent-urgent-text` with a clock icon. This is the only countdown surface.

**Craving chip row.** Horizontal scroll, tap reveals a swipeable card stack. This is the
signature interaction per PRD §5.3 and it is the thing the prototype is missing — the
prototype has mood chips filtering a static grid instead. Build the card stack properly in
P3-3 rather than retrofitting it later.

---

## 5. Motion

Four approved moments. Everything else is off.

1. Hero entrance fade-up, once, on first load only — not on every route change back to home.
2. Craving chip tap → card stack reveal.
3. Card swipe.
4. Ticker drag-to-scroll (the prototype's drag handling is good, keep it).

Explicitly removed from the prototype: hero parallax on scroll, ticker auto-scroll, hover
translateY on every card and chip, and the fade-up on the search results panel. Auto-scroll
in particular fights the user — it moves the thing they're trying to read and it runs a
rAF loop on a phone that's already low on battery between classes.

`prefers-reduced-motion: reduce` disables all four.

---

## 6. Accessibility floor

- Every interactive element has a visible keyboard focus state. The prototype has none on
  chips, tabs, or cards.
- Body text at AA against its own surface. The two values corrected above (`text-muted`,
  turmeric over marigold) are what get you there.
- Veg/non-veg is never colour alone — square outline plus the filled dot, so it survives
  colour blindness and greyscale.
- Mobile-first. Test on a real mid-range Android, not devtools, per build plan P3-7.

---

## 7. Carried over from the prototype as-is

Structure, not styling — these were good and don't need redesigning:

- Page inventory and routing shape
- Card anatomy: media carousel, dots, save toggle, meta row, vibe pills, dashed footer rule
- The ticker as the "today's specials" rail
- Filter popup with a count badge on the trigger
- Booking wizard step structure
- Owner dashboard sidebar layout
- The tear-off calendar button shape — reuse it for something in scope if events are cut
