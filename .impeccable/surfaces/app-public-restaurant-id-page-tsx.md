---
version: 1
slug: 'app-public-restaurant-id-page-tsx'
primary_target: 'app/(public)/restaurant/[id]/page.tsx'
related_targets:
  [
    'app/(public)/restaurant/[id]/restaurant.module.css',
    'components/ui/PhotoCarousel.tsx',
    'components/features/ReviewList.tsx',
    'components/features/ShareButton.tsx',
    'components/features/RsvpButton.tsx',
  ]
---

# Restaurant detail redesign

- Scope: production route `/restaurant/[id]`; visitor mode is Operate with an image-led decision surface.
- Audience and job: a student validating one restaurant through practical details, current commercial content, menu, events, hours, and verified reviews before acting.
- Primary actions: save, share, open directions, send the existing booking heads-up, flag an incorrect offer, RSVP, inspect menu content, or open a recommendation.
- Required evidence: current restaurant summary, opening state, rating count, price, owner description, features, live offers, upcoming events, menu, hours, reviews, and related restaurants.
- Constraints: preserve metadata, detail/recommendation queries, profile-view source logging, auth gates, RSVP/save state, external directions, share behavior, booking route, empty states, and all action payloads.
- Direction: extend the light Destiny world with a cinematic black split hero, an off-white canvas, mint menu/offer fields, flat white information panels, teal actions, and a compact black recommendation close.
- Memorable moment: one food image and one decisive black information field make the restaurant understandable before the first scroll.
- Responsive rule: stack image above information on narrow screens, retain 44px actions, keep menu/hours readable at 320px, and remove all horizontal page overflow.
