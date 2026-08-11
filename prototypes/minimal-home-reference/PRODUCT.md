# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 and Vite 6 in a self-contained Product Design prototype. This test must not modify or replace the production Next.js routes.

## Users

The primary user is an NIT Warangal student deciding where to eat around campus, often quickly and with friends. Restaurant owners are a secondary audience who keep menus, live offers, and events current in the production product.

## Product Purpose

Destiny helps students choose a nearby place to eat by bringing together current offers, dish-level discovery, menus, practical restaurant details, and campus-relevant events. Success for this prototype is showing that the same decision journey can feel clearer, more visual, and faster on the homepage.

## Positioning

Unlike delivery marketplaces, Destiny is campus-specific and owner-updated. It helps students decide where to dine rather than order delivery, and it can surface fresh small updates, dishes, student discounts, and events that larger aggregators do not prioritize.

## Operating Context

Students typically browse on a phone between classes or while making evening plans. The homepage should answer “what sounds good right now?” quickly, then make it easy to browse a craving, see a current offer, or open a restaurant.

## Capabilities and Constraints

- Public browsing must work without authentication.
- The homepage may surface current offers, cravings, restaurants, events, and the short preference quiz.
- The product is for discovery and booking notices, not ordering, payments, delivery, or guaranteed table reservations.
- Distance is optional and must never block browsing.
- This deliverable is one isolated homepage concept only; no current route or production component may be changed.

## Brand Commitments

The product name is Destiny. Product language is direct, useful, campus-aware, and never overclaims freshness or availability. For this prototype, the supplied culinary UI video is the binding visual reference and the requested interpretation is minimalist and clean.

## Evidence on Hand

- Production product truth: `../../README.md` and `../../docs/prd.md`.
- Incumbent homepage behavior: `../../app/(public)/page.tsx`.
- Incumbent visual system: `../../docs/design.md` and `../../app/globals.css`.
- Selected visual reference: `../../tmp/video-reference/frame-04.png`, extracted from the user-supplied MP4.
- No testimonials, pricing, customer logos, usage benchmarks, or guaranteed real-time availability claims are available and none may be fabricated.

## Product Principles

1. Shorten the decision from vague hunger to a concrete place or dish.
2. Treat freshness as earned product data, not decorative copy.
3. Keep the campus dining decision social without exposing private bookings.
4. Prefer a few strong choices over an overwhelming directory wall.
5. Preserve honest boundaries: discovery and notice, not delivery or reservation guarantees.

## Accessibility & Inclusion

The homepage must support keyboard navigation, visible focus, reduced motion, readable contrast, and mobile layouts down to 320px. Food preferences and restaurant states must not rely on color alone.
