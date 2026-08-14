---
version: 1
slug: 'app-public-search-page-tsx'
primary_target: 'app/(public)/search/page.tsx'
related_targets:
  [
    'components/features/FilterBar.tsx',
    'components/features/RestaurantGrid.tsx',
    'components/features/RestaurantCard.tsx',
    'components/features/SiteNav.tsx',
  ]
---

# Search redesign

- Scope: production route `/search`; visitor mode is Operate.
- Audience and job: a student narrowing the current restaurant catalog by dish, craving, price, practical needs, or distance without losing context.
- Primary task: enter a query or adjust URL-backed filters, scan a compact shortlist, and open one restaurant.
- Required evidence: restaurant summaries, dish hits, active filter state, live offers, open state, optional distance, loading, and honest empty results.
- Constraints: preserve every search parameter, server filter, sort, debounce, explicit-only location request, analytics source, and restaurant link.
- Direction: extend the approved light Destiny world with a large decision heading, white search pill, flat filter rail, mint dish results, and a compact black restaurant field.
- Memorable moment: filtering stays visually light while the resulting shortlist lands as one decisive black editorial band.
- Responsive rule: controls remain 44px minimum, filter rails scroll without page overflow, and restaurant cards become compact horizontal rows below 620px.
