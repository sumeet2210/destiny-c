# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is currently an NIT Warangal student deciding where to eat around campus, often quickly and with friends. This campus limitation is operational context, not a message the homepage should prominently advertise. Restaurant owners are a secondary audience who keep menus, offers, events, photos, and practical details current.

## Product Purpose

Destiny helps students move from a vague dining decision to a credible nearby restaurant by combining current offers, dish-level discovery, menus, practical details, campus-relevant events, and tightly scoped friend activity. Success means a student can find an appealing option quickly and continue into the existing restaurant, event, quiz, save, or booking flows without confusion.

## Positioning

Destiny is a local dine-out discovery product, not a delivery marketplace. Owner-updated offers, menus, events, student-relevant details, and mutual-friend signals make it useful for small, current decisions that large delivery aggregators do not prioritize.

## Operating Context

Students typically browse on a phone between classes or while making evening plans with friends. Public browsing requires no login. Authenticated students may save restaurants and see opt-in friend activity. Owners manage restaurant information through separate authenticated routes.

## Capabilities and Constraints

- Preserve the existing route inventory, data queries, analytics sources, authentication boundaries, and business rules.
- The homepage surfaces current offers, craving-based restaurant discovery, upcoming events, conditional friend activity, popular restaurants, and the preference quiz entry point.
- Saving and social activity remain available only under their existing authentication and privacy rules.
- Distance remains optional and may never block browsing or prompt on initial load.
- Booking is an informational notice, not a guaranteed reservation.
- Ordering, payments, delivery, public social feeds, and location maps remain out of scope.
- Visual redesigns must not remove, rename, or materially change product features without explicit approval.

## Brand Commitments

The product name is Destiny. The supplied Destiny wordmark and brand palette are binding assets. Product language is direct, useful, campus-aware without overemphasizing the current campus limitation, and never overclaims freshness, availability, or reservation certainty. The finalized homepage prototype in `prototypes/minimal-home-reference` is the approved visual reference for the production redesign.

## Evidence on Hand

- Product requirements: `docs/prd.md`.
- Existing homepage behavior: `app/(public)/page.tsx` and its imported feature components.
- Approved prototype implementation: `prototypes/minimal-home-reference/src`.
- Approved prototype system: `prototypes/minimal-home-reference/DESIGN.md`.
- Approved wordmark: `prototypes/minimal-home-reference/public/brand/destiny-wordmark.png`.
- No testimonials, usage benchmarks, guaranteed real-time availability claims, or commercial proof may be fabricated.

## Product Principles

1. Shorten the path from hunger to a concrete place or dish.
2. Preserve trustworthy product data and honest feature boundaries.
3. Keep discovery useful without authentication; layer personal actions in only when eligible.
4. Make group decision-making helpful without exposing private booking information.
5. Prefer a clear shortlist and strong hierarchy over an overwhelming directory wall.

## Accessibility & Inclusion

The web experience must support keyboard navigation, visible focus, reduced motion, readable contrast, semantic states, and responsive layouts down to 320px. Food preferences and restaurant states must not rely on color alone.
