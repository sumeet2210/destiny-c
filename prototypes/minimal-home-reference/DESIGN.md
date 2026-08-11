---
name: Destiny — The Campus Shortlist
description: 'A cinematic campus dining decision system using the official Destiny identity.'
colors:
  destiny-teal: '#00B89C'
  destiny-black: '#000000'
  pure-white: '#FFFFFF'
  soft-off-white: '#F8FAFA'
  dark-teal: '#008F7A'
  light-teal: '#25CBB5'
  mint-light: '#E6FAF6'
  stone-gray: '#4B5563'
typography:
  family: '"Manrope Variable", "Manrope", sans-serif'
  display: 'clamp(3.45rem, 7.1vw, 6rem) / 0.9 / 540'
  headline: 'clamp(2.6rem, 5.6vw, 5rem) / 0.95 / 520'
  title: 'clamp(1.45rem, 2vw, 2rem) / 1 / 580'
  body: 'clamp(1rem, 1.3vw, 1.18rem) / 1.55 / 400'
  label: '0.83rem / 1.2 / 700'
rounded:
  pill: '999px'
  surface-large: '2.25rem'
  surface-medium: '1.65rem'
  panel-small: '1.2rem'
  circle: '50%'
assets:
  wordmark: 'public/brand/destiny-wordmark.png'
---

# Design System: Destiny — The Campus Shortlist

## Direction

The homepage turns a vague dining decision into one credible campus choice. It keeps the cinematic food photography, editorial scale, rounded controls, and short decision path of the selected culinary reference while using the official Destiny brand system as the binding identity.

The prototype is a light-first discovery surface with black editorial sections. Destiny Teal identifies primary action and selection. Black, white, and soft off-white carry the majority of the composition. Supporting teals and Stone Gray are used only for hierarchy, hover, and secondary information.

## Binding palette

Only these colors may appear in UI chrome:

| Token          | Hex       | Use                                                             |
| -------------- | --------- | --------------------------------------------------------------- |
| Destiny Teal   | `#00B89C` | Primary CTAs, active choices, active navigation, brand emphasis |
| Destiny Black  | `#000000` | Primary text, decisive fields, dark editorial section           |
| Pure White     | `#FFFFFF` | Controls and text on dark surfaces                              |
| Soft Off-White | `#F8FAFA` | Page canvas and light background                                |
| Dark Teal      | `#008F7A` | Hover states and the live-update panel                          |
| Light Teal     | `#25CBB5` | Secondary emphasis and offer text                               |
| Mint Light     | `#E6FAF6` | Soft panels and supporting text on dark teal                    |
| Stone Gray     | `#4B5563` | Secondary text and placeholders                                 |

Transparent mixtures of these colors are permitted for scrims, hairlines, and media glass. Food photography is exempt from the UI palette.

### Palette rules

- Destiny Teal is the only primary action color.
- Dark Teal is interactive or structural support, never a competing primary accent.
- Light Teal and Mint Light support hierarchy; they do not become broad decorative fields.
- Do not reintroduce acid lime, turmeric, warm bone, or undocumented gray ramps.
- Focus treatment must remain visible across both white and black surfaces using the approved black/white pair.

## Identity

Use the supplied transparent wordmark at `public/brand/destiny-wordmark.png` in the header and footer. Never rebuild the mark with styled text. Keep clear space around the asset and display it on Soft Off-White or Pure White.

## Typography

Manrope Variable remains the interface family because its rounded geometry complements the supplied wordmark without imitating it. Large display type frames a decision, not a marketing slogan. Body text stays open and direct. Compact metadata remains at least 0.68rem and uses Stone Gray on light surfaces or Mint Light on dark surfaces.

## Layout

The page remains inside a 1600px maximum shell. The first viewport is an asymmetric decision hero on desktop and an image-backed composition on mobile. At 850px the hero becomes one column; at 620px it becomes the mobile overlay composition with persistent bottom navigation and safe-area spacing.

The discovery section is intentionally shorter than the hero. One selected craving produces one compact restaurant match beside the live-update panel on desktop. It must not stretch to fill the available page. At mobile widths the card becomes a horizontal media-and-content surface approximately 17rem tall, allowing the student to reach the next option or live updates quickly.

## Components

### Primary actions

- Destiny Teal fill with black text.
- Dark Teal hover with white text.
- Minimum 44px target on touch surfaces.
- White inner and black outer focus treatment for visibility across the full palette.

### Choice chips

- Rest: transparent with a black or white hairline according to the surface.
- Active: Destiny Teal with black text.
- Active state includes `aria-pressed`; quiz choices also include a checkmark.
- Mobile craving chips form a horizontal rail.

### Search

- Pure White pill with black text and Stone Gray placeholder.
- Destiny Teal circular submit action.
- Focus is communicated on the whole field without relying on low-contrast teal alone.

### Restaurant result card

- Compact, production-minded anatomy: media, context tag, save toggle, supporting metadata, restaurant name, current highlight, area/price, and a clear open action.
- Desktop height: about 24rem; mobile height: about 17rem in a horizontal layout.
- Black content surface, Pure White text, Light Teal highlight, Mint Light metadata.
- Image motion is hover-only and disabled for reduced motion.
- A single result retains its intrinsic compact width and height; it never expands into a full-page billboard.

### Live update panel

- Dark Teal background with Pure White primary text and Mint Light supporting text.
- Keeps the same compact height as the desktop restaurant result.
- Updates remain secondary to choosing a restaurant.

### Navigation

- Desktop navigation remains a white pill inside the sticky header.
- Mobile navigation remains black glass with Destiny Teal for the active location.
- Anchor targets account for the sticky header, and the active location is exposed with `aria-current`.

## Motion

Motion is limited to smooth section navigation, the preference panel reveal, and a subtle media crop on pointer hover. Reduced-motion mode removes smooth scrolling and animated transitions without hiding state changes.

## Accessibility floor

- Keyboard focus is visible on every surface.
- Text and placeholder contrast meet WCAG AA.
- All mobile targets are at least 44px.
- Save and choice controls expose pressed state.
- The page has no horizontal overflow at 320px.
- Section anchors are not obscured by sticky navigation.

## Do / do not

- Do keep the single decisive hero, real food imagery, short choice set, and campus-aware copy.
- Do use the supplied logo asset and the exact approved palette.
- Do keep restaurant cards compact enough to resemble a production discovery grid.
- Do not recreate the logo in text.
- Do not add colors outside the supplied brand sheet.
- Do not let one restaurant result occupy an entire viewport.
- Do not turn the homepage into an endless directory feed.
