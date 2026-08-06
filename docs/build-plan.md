# Build Plan — NITW Campus Food Discovery Platform (v2)

Companion to `prd.md` and `architecture.md`. Those describe what and with what; this
describes in what order, by whom, and in what size chunks.

**What changed in v2.** The prototype's features are now in scope, which adds roughly three
weeks. The social layer became its own phase and moved to the end, deliberately — see the
note on Phase 9. Everything the PRD hasn't decided still lives in a config file, not
scattered through code.

---

## 0. Six rules that make later changes cheap

Agree on these before anyone writes a feature. They're the difference between "change the
price buckets" being a 2-minute edit and a 2-hour grep.

**0.1 No component talks to Supabase directly.** Every query lives in
`/lib/queries/<entity>.ts` and returns plain typed objects. A schema rename touches one
folder instead of forty files.

**0.2 Undecided product values live in `/config`, never inline.**

| File                      | Holds                                         |
| ------------------------- | --------------------------------------------- |
| `config/cravings.ts`      | craving tags, labels, emoji                   |
| `config/vibes.ts`         | vibe tags and labels                          |
| `config/price-buckets.ts` | the ₹ ranges                                  |
| `config/areas.ts`         | named clusters                                |
| `config/auth.ts`          | NITW email domain                             |
| `config/booking.ts`       | lead time, reminder window, no-show threshold |
| `config/events.ts`        | event types and labels                        |
| `config/quiz.ts`          | quiz questions and their filter mapping       |
| `config/social.ts`        | friend limits, sharing defaults               |

Every open question in PRD §8 becomes a placeholder here on day one.

**0.3 Types are generated, never hand-written.** `supabase gen types typescript` into
`/types/db.ts`, committed. Regenerating after a migration is part of the migration ticket.

**0.4 Business rules are pure functions with no React and no network.**
`/lib/domain/booking.ts`, `/lib/domain/hours.ts`, `/lib/domain/distance.ts`. These get unit
tests. If the PRD changes the lead time from 1 hour to 45 minutes, one file changes and the
tests tell you nothing else broke.

**0.5 Two kinds of components, kept apart.** `/components/ui/*` knows only design tokens.
`/components/features/*` knows about restaurants and offers. Nothing in `ui/` ever imports
from `lib/queries`.

**0.6 Fetch in server components, interact in client components.** Default to server. Add
`"use client"` deliberately, and only to the smallest leaf that needs it.

---

## 1. Working as a group

**Split by vertical slice, not by layer.** "You do frontend, I do backend" creates constant
merge conflicts and blocks everyone on one person. One person owns offers end to end,
another owns booking end to end. Rules 0.1–0.6 are what make this work.

**One migration owner.** Pick one person. All schema changes go through them, even trivial
ones. Two people writing migrations in parallel produces conflicting timestamps and a broken
dev database — the single most likely way to lose a day.

**Branch and PR rules.** `main` protected, no direct pushes. Branch names lead with the
ticket ID: `p3-2/restaurant-profile-page`. One ticket per PR; over ~300 changed lines it
should probably have been two. Every PR gets one review, mainly so two people know how each
part works.

**Definition of done for any ticket:**

1. Works on a mobile viewport — this is a phone product
2. Loading and empty states exist, not just the happy path
3. No new color, font, or spacing value that isn't in the Tailwind config
4. RLS still enforced, no policy loosened "just for testing"
5. Types regenerated if the schema moved
6. Deployed preview link on the PR

---

## 2. Phases and tickets

Each ticket is sized to finish in one sitting. Each phase ends in something demoable.

### Phase 0 — Foundations (together, one session, before splitting up)

| ID   | Ticket                                                                                                | Done when                                              |
| ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| P0-1 | Next.js App Router + TS + Tailwind, ESLint + Prettier, folder skeleton                                | `npm run dev` works, lint passes                       |
| P0-2 | Tailwind tokens from `design.md` v2 — dark palette, three font families, spacing scale                | `bg-canvas`, `text-paper` etc. resolve                 |
| P0-3 | Two Supabase projects (dev, prod), `lib/supabase/{client,server}.ts`, env vars locally and in Netlify | A test query from a server component returns something |
| P0-4 | Deploy empty homepage to Netlify, connect GitHub, confirm preview URLs on PRs                         | Push to `main` goes live automatically                 |
| P0-5 | Create all nine `/config` files with placeholders and a comment naming the PRD question               | Files exist, imported nowhere yet                      |
| P0-6 | `/docs` holding prd, architecture, build-plan, design, decisions, runbook                             | Committed                                              |

**Ship P0-4 before any feature work.** Discovering a deploy problem in week four is much
worse than in hour two.

### Phase 1 — Data layer (migration owner drives)

RLS goes in the same migration as the table it protects. Never a separate "add RLS later"
ticket.

| ID    | Ticket                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P1-1  | Enums (`user_role`, `restaurant_status`, `booking_status`, `photo_kind`, `event_type`, `friendship_status`) + `users` + RLS           |
| P1-2  | `restaurants` + RLS (public read where `status = 'active'`), including `vibe_tags`, `opening_hours`, `lat`/`lng`                      |
| P1-3  | `is_open_now(jsonb, timestamptz)` SQL function + tests against split shifts and past-midnight closes                                  |
| P1-4  | `menu_items` + RLS                                                                                                                    |
| P1-5  | `offers` + RLS (public read where `is_active`)                                                                                        |
| P1-6  | `restaurant_photos` + RLS                                                                                                             |
| P1-7  | `events` + RLS                                                                                                                        |
| P1-8  | `bookings` + `reviews` + RLS                                                                                                          |
| P1-9  | `profile_views` + RLS (insert-only public, owner reads own)                                                                           |
| P1-10 | `saved_restaurants`, `friendships`, `event_rsvps` + `friend_edges` view + RLS                                                         |
| P1-11 | **RLS test script**: three accounts (friend / non-friend / friend with sharing off) asserting who can read what                       |
| P1-12 | Seed script: 6 restaurants with real opening hours, ~40 menu items, 8 offers, 5 events, spread across craving, vibe and price buckets |
| P1-13 | Generate and commit `/types/db.ts`                                                                                                    |

**P1-11 is not optional.** The social-layer policies are the only place in this app where a
bug leaks one student's data to another. Test them before anything reads them, not after.

**P1-12 is not optional either.** Everything in Phases 2 and 3 gets built against it, which
means UI work starts before a single real restaurant has signed up.

### Phase 2 — Design primitives (parallel to Phase 1)

Build against a `/dev/components` kitchen-sink route rendering every primitive in every
state. Fastest way to catch a broken component later, and it costs nothing to maintain.

| ID   | Ticket                                                                                |
| ---- | ------------------------------------------------------------------------------------- |
| P2-1 | Font loading (Roboto Slab, Inter, JetBrains Mono) + typography scale                  |
| P2-2 | `Chip` — default, active, disabled, focus ring                                        |
| P2-3 | `Card` shell — `surface-muted` on `canvas`, no shadow, no gradient                    |
| P2-4 | `MenuRow` — name left, dotted leader, mono price right, veg indicator                 |
| P2-5 | `OfferBadge` — including the expiry countdown, the only place `accent-urgent` appears |
| P2-6 | `EventCard` — type icon, date block, time, RSVP slot                                  |
| P2-7 | `PhotoCarousel` — dots, swipe, lazy load                                              |
| P2-8 | `Button`, `Input`, `Sheet`/modal, `Skeleton`, `Toast`                                 |
| P2-9 | Kitchen-sink route rendering all of the above                                         |

### Phase 3 — Public browsing, no login (the real de-risker)

Everything read-only against seed data. It's the whole value proposition, and it works
before auth exists.

| ID    | Ticket                                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3-1  | Homepage shell + today's specials ticker, sorted by soonest expiry, drag-to-scroll                                                                  |
| P3-2  | Restaurant profile: photos, gallery, menu, offers, tags, area, open/closed badge                                                                    |
| P3-3  | Craving chip row: horizontal scroll, tap reveals swipeable card stack (the signature interaction — build it properly here rather than retrofitting) |
| P3-4  | Search page: veg/non-veg + price bucket + open now filters                                                                                          |
| P3-5  | Dish-level search — restaurants and matching menu items with prices                                                                                 |
| P3-6  | Events page + calendar entry point on the homepage                                                                                                  |
| P3-7  | Events section on the restaurant profile                                                                                                            |
| P3-8  | Vibe filter chips in the filter panel                                                                                                               |
| P3-9  | "Find your perfect spot" quiz → pre-filled filter set, client-side only                                                                             |
| P3-10 | Optional geolocation: distance display, "nearest" sort, graceful decline path                                                                       |
| P3-11 | Get directions (map deep link) + share                                                                                                              |
| P3-12 | "You may also like" — three by shared area or craving tag                                                                                           |
| P3-13 | `profile_views` logging with `source_filter` on every profile open, all six sources                                                                 |
| P3-14 | Empty, loading and error states for feed, search, events and profile                                                                                |
| P3-15 | Mobile QA pass on a real phone, not just devtools                                                                                                   |

**Demo checkpoint.** At the end of Phase 3 you can put this in front of a restaurant owner
and a few students. Do that before building Phase 5 — their reaction may change what Phase 5
should be.

### Phase 4 — Auth

| ID   | Ticket                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| P4-1 | Student email OTP restricted to the domain in `config/auth.ts`, checked on the route and by a Postgres check function |
| P4-2 | Session handling, `requireStudent()` server helper, protected route wrapper                                           |
| P4-3 | Owner signup, creates restaurant at `pending_approval`                                                                |
| P4-4 | Owner login + "awaiting approval" holding screen                                                                      |
| P4-5 | Manual approval steps written into `docs/runbook.md` — Supabase table editor, no admin UI in v1                       |

### Phase 5 — Owner tools

| ID    | Ticket                                                                                   |
| ----- | ---------------------------------------------------------------------------------------- |
| P5-1  | Dashboard shell + sidebar nav                                                            |
| P5-2  | Edit profile fields (veg only, AC, dine-in, price per head, student discount, vibe tags) |
| P5-3  | Opening hours editor — per-day, split shifts, closed days                                |
| P5-4  | Menu CRUD                                                                                |
| P5-5  | Image upload to Supabase Storage with client-side resize to 1600px WebP                  |
| P5-6  | Gallery and menu-photo management — reorder, delete                                      |
| P5-7  | Create offer, expiry defaults to end of day                                              |
| P5-8  | Offer list, edit, manual deactivate                                                      |
| P5-9  | Event CRUD — type, date/time, optional image, cancel                                     |
| P5-10 | Expiry sweeps (`pg_cron` or Edge Function) for offers and past events                    |
| P5-11 | Student-facing "this offer looks wrong" flag incrementing `flagged_count`                |

### Phase 6 — Booking (highest risk, most tickets, go slowest here)

| ID    | Ticket                                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P6-1  | `/lib/domain/booking.ts` pure state machine + unit tests, no UI at all                                                              |
| P6-2  | Booking form: date/time, headcount, special request, client-side lead-time check                                                    |
| P6-3  | `POST /api/bookings` with server-side lead-time revalidation (source of truth)                                                      |
| P6-4  | Student's own bookings list                                                                                                         |
| P6-5  | Owner bookings list with headcount, requests, status                                                                                |
| P6-6  | Owner note on a booking — note only, no status change                                                                               |
| P6-7  | Reminder sweep: cron every 5 min, finds bookings crossing `booking_time - 30min`, sends email, sets `reminder_sent_at`              |
| P6-8  | Confirm page reached from the reminder, sets `confirmed_at`                                                                         |
| P6-9  | Resolution sweep: past `booking_time` with no confirm → `unconfirmed` (never `cancelled`) → `completed`, increments `no_show_count` |
| P6-10 | Tightened confirmation window for students past the no-show threshold                                                               |
| P6-11 | Copy audit across the whole flow: every label says "letting the owner know", never "table reserved"                                 |

**Write P6-1 first and completely.** The state machine having tests is what lets you change
the reminder window later without re-reasoning about the whole flow.

### Phase 7 — Analytics

| ID   | Ticket                                                                      |
| ---- | --------------------------------------------------------------------------- |
| P7-1 | SQL aggregation views: views by day, views by `source_filter`               |
| P7-2 | Owner analytics page, 7/30 day toggle, source breakdown                     |
| P7-3 | "Trending today" from 24h view velocity, wired into sort                    |
| P7-4 | Event performance: views attributed to `source_filter = 'events'` per event |
| P7-5 | Copy check: this is profile views, not footfall, and the UI must say so     |

### Phase 8 — Reviews

| ID   | Ticket                                                                               |
| ---- | ------------------------------------------------------------------------------------ |
| P8-1 | Write review, gated to `completed` bookings owned by the requester                   |
| P8-2 | Reviews on the profile + aggregate rating and count                                  |
| P8-3 | Review sort — newest, highest, lowest                                                |
| P8-4 | Rating filter and "highest rated" sort, enabled only once review volume justifies it |

### Phase 9 — Social layer (last on purpose, and cuttable)

| ID   | Ticket                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------- |
| P9-1 | Save/unsave a restaurant + saved page                                                                    |
| P9-2 | Friend request, accept, decline, remove — all through `friend_edges`                                     |
| P9-3 | Activity sharing toggle in settings, off by default, with plain-language copy about what becomes visible |
| P9-4 | Event RSVP                                                                                               |
| P9-5 | Friend activity row on cards — "3 friends saved this"                                                    |
| P9-6 | "Where the squad's going" homepage section                                                               |
| P9-7 | Privacy pass: re-run P1-11 against the live UI, confirm bookings leak nowhere                            |

**Why this is last.** With ten users a friend graph is dead weight — there's nobody to see.
It's also the only part of the app where a bug harms a user rather than annoying them, so it
benefits most from being built when you're fastest and most familiar with the codebase. And
it's the cleanest thing to cut if you're running late: nothing else depends on it.

Until P9-6 ships, the homepage section that reads "Where the squad's going" in the prototype
should be labelled something honest like "Popular this week", driven by view velocity.

### Phase 10 — Soft launch prep

| ID    | Ticket                                                                                 |
| ----- | -------------------------------------------------------------------------------------- |
| P10-1 | Keep-alive ping so the free-tier project doesn't pause                                 |
| P10-2 | Manual DB export routine documented in the runbook                                     |
| P10-3 | Remove seed data from prod, onboard the first real restaurant end to end yourself      |
| P10-4 | Error monitoring (Sentry free tier)                                                    |
| P10-5 | Area filter enabled once enough restaurants exist that it doesn't return empty results |
| P10-6 | Storage audit — confirm resize-on-upload is working before the bucket fills            |

---

## 3. Who can work at the same time

| Window   | Lane A                         | Lane B                             | Lane C                              |
| -------- | ------------------------------ | ---------------------------------- | ----------------------------------- |
| Week 1   | Phase 0 together               |                                    |                                     |
| Week 1–2 | Phase 1 (migration owner)      | Phase 2 primitives                 | Phase 2 primitives                  |
| Week 2–3 | P3-1, P3-3 (homepage + chips)  | P3-2, P3-7 (profile + events)      | P3-4, P3-5, P3-8 (search + filters) |
| Week 3–4 | P3-6, P3-9 to P3-13            | Phase 4 auth                       | P5-1 to P5-4 (dashboard + menu)     |
| Week 4–5 | P6-1 to P6-3                   | P5-5, P5-6, P5-9 (images + events) | P5-7, P5-8, P5-10 (offers + sweeps) |
| Week 5–6 | P6-4 to P6-8                   | Phase 7 analytics                  | Phase 8 reviews                     |
| Week 6–7 | P6-9 to P6-11                  | Phase 9 social                     | Phase 10 prep                       |
| Week 7–8 | Buffer, QA, real-device passes |                                    |                                     |

Adjust for your actual team size. With two people, drop Lane C and add about three weeks.

---

## 4. What's still undecided, and where it's parked

| Open question                          | Placeholder lives in      | Decide before               |
| -------------------------------------- | ------------------------- | --------------------------- |
| Exact NITW student email domain        | `config/auth.ts`          | P4-1                        |
| Area cluster boundaries                | `config/areas.ts`         | P10-5                       |
| Who approves owner signups             | `docs/runbook.md`         | P4-5                        |
| Craving tag list                       | `config/cravings.ts`      | P3-3 (easy to extend after) |
| Price bucket ranges                    | `config/price-buckets.ts` | P3-4                        |
| Vibe tag list                          | `config/vibes.ts`         | P3-8                        |
| Event types                            | `config/events.ts`        | P5-9                        |
| Quiz questions and filter mapping      | `config/quiz.ts`          | P3-9                        |
| No-show threshold and tightened window | `config/booking.ts`       | P6-10                       |
| Friend limit, if any                   | `config/social.ts`        | P9-2                        |

None of these block the start of the build, which is the point of listing them.

---

## 5. Keeping the docs alive

`prd.md`, `architecture.md` and `design.md` live in `/docs` and change only through a PR,
same as code. `docs/decisions.md` gets a dated entry for anything that contradicts them:

```
2026-08-14 — Offer expiry default changed from end-of-day to 6 hours.
Why: owners posting at 11pm had offers die instantly.
Affects: P5-7, config/offers.ts
```

If a decision invalidates a ticket that hasn't been started, edit the ticket here. If it
invalidates a ticket already shipped, open a new ticket rather than silently rewriting
history.

---

## 6. Milestones

1. **Deploy works** — end of P0-4
2. **Data + design primitives exist** — end of Phase 2
3. **A student can browse and decide where to eat** — end of Phase 3. Show this to real users.
4. **An owner can post a live offer and an event that a student sees** — end of Phase 5. The
   core loop, and the first point at which the product is actually useful.
5. **Booking round-trips with a reminder** — end of Phase 6
6. **Soft launch with 3 to 5 real restaurants** — end of Phase 10

Milestone 4 is the one that matters. Everything before it is setup and everything after is
improvement — including the entire social layer, which is why it can slip without hurting.
