# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Prototype-specific direction

- This is an isolated one-homepage visual test for Destiny. Never edit or replace the production Next.js pages from this prototype.
- Source truth is the user-supplied culinary UI video, captured at `../../tmp/video-reference/frame-04.png`.
- Translate the reference's bold rounded controls, editorial food photography, charcoal/soft-white balance, frosted overlays, and single acid-lime accent into a responsive website composition.
- Keep the result minimalist and clean. Preserve Destiny's real homepage job: help an NIT Warangal student decide where to eat now.
- Treat phone layouts as a first-class surface: use an image-backed first viewport, touch targets of at least 44px, safe-area-aware chrome, and persistent one-page navigation without weakening the desktop composition.
- The user-supplied Destiny brand palette and logo assets are now binding. UI chrome may use only Destiny Teal `#00B89C`, Destiny Black `#000000`, Pure White `#FFFFFF`, Soft Off-White `#F8FAFA`, Dark Teal `#008F7A`, Light Teal `#25CBB5`, Mint Light `#E6FAF6`, and Stone Gray `#4B5563`, plus transparent mixtures of those colors. Food photography is exempt.
- Use the supplied transparent Destiny wordmark at `public/brand/destiny-wordmark.png`; do not reconstruct the logo with text or substitute the earlier dotted wordmark.
- Restaurant result cards must remain compact and production-minded. A single match must not expand into a full-page editorial card; preserve the production card's useful anatomy (media, save, context, offer/highlight, area, and price) within a compact responsive surface.
