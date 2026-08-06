# PRD — NITW Campus Food Discovery Platform (v2)

Supersedes v1. Changes from v1 are marked **[new in v2]**. The driver was the
`destiny-food-app` prototype, which shipped several features v1 didn't describe; rather than
delete them, they've been folded in and scoped.

---

## 1. Problem

Students around NIT Warangal have no niche way to decide where to eat. Zomato and Swiggy are
built for delivery logistics and take heavy commission, so restaurants don't bother posting
small live updates — today's offer, a sold-out dish, a student discount, a live music night.
There is no single place that answers "what's good nearby, is there a student discount, and
what's actually happening tonight."

Restaurants near campus have independently confirmed this is a real problem and are
interested in a platform built for this audience specifically.

---

## 2. Goals (v1 / testing period)

- Give students a fast way to decide where to eat, filtered by craving, price, vibe, and
  practical constraints (open now, veg/non-veg, group size).
- Let restaurant owners post live offers, menu updates, and events themselves, without an
  aggregator's commission.
- Let owners see whether the platform is driving interest — profile views, and which filters
  bring people to them.
- Give owners a heads-up when a group is likely coming, without becoming a reservation system.
- **[new in v2]** Make the decision social. Deciding where to eat on a campus is a group
  activity, and the prototype's strongest instinct was surfacing what other people are doing.
- No monetization in v1 — this phase proves usage and reliability, not revenue.

---

## 3. Non-goals (explicitly out of scope)

- **Payments and online ordering.** Discovery and booking-notice, not delivery or POS.
- **Real-time footfall tracking.** "Visitor count" means profile page views. Never conflate
  the two in copy or UI.
- **Subscription or commission monetization.** Deferred until the testing period proves usage.
- **WhatsApp offer parsing.** Owners have confirmed they'll update directly on-site.
- **Full owner POS or table management.** Booking informs the owner; it does not manage their
  floor, and the owner cannot accept or decline. See §5.7.
- **[new in v2] Public social feeds, comments, follower counts, or DMs.** The social layer is
  mutual-consent friends only, and it shows two facts (saved, going to an event) — not a
  timeline. This boundary is what keeps it cheap and keeps it from becoming a moderation
  problem on a campus where everyone knows everyone.
- **[new in v2] GPS-based search or a map view.** Distance is display-only. The primary
  location filter remains named area clusters. See §5.4.

---

## 4. Users

**Student.** Logs in via NITW student email (OTP). Browses and filters restaurants, views
live offers and events, books a table with headcount and special requests, saves places,
adds friends, leaves reviews gated to visits they actually booked and didn't no-show.

**Restaurant owner.** Mandatory login, manually approved by the platform admin at signup
during the testing period. Manages profile, photos, menu, live offers, events, and views
incoming bookings plus a lightweight analytics dashboard.

**Admin (you, during testing).** Approves owner signups, monitors platform health via the
Supabase dashboard. No admin UI in v1.

---

## 5. Core features

### 5.1 Auth

- Student: NITW institute email domain only, OTP-based, no password.
- Owner: mandatory login, manually approved before the account can publish anything live.
- Browsing the directory requires no login. Booking, reviews, saving, and the social layer
  all do.

### 5.2 Restaurant directory and profile page

Each restaurant has a page with:

- Cover photo and a photo gallery **[new in v2]**
- Full menu — items, prices, veg/non-veg indicator — in receipt style (see `design.md`)
- Menu photos, for owners who'd rather upload a photo of the physical menu **[new in v2]**
- Student discount flag, current live offers, upcoming events **[new in v2]**
- Area cluster, veg/non-veg/AC info, vibe tags **[new in v2]**
- Open/closed status computed from opening hours **[new in v2]**
- Reviews, sortable by newest, highest, and lowest **[new in v2]**
- "You may also like" — three restaurants sharing area or craving tags **[new in v2]**
- Get directions (opens the device map app) and share **[new in v2]**

**Opening hours are new and load-bearing.** v1 had an "open now" filter with nothing in the
schema to compute it from. Every restaurant now stores per-day open and close times.

### 5.3 Filters and search

Quick chips, always visible:

- **Craving** (Biryani, Momos, Chai, Ice Cream…) — the signature interaction, see `design.md`
- Veg / non-veg / egg
- Open now
- Has live offer

Filter panel:

- Price per head — under ₹100, ₹100–200, ₹200–400, ₹400+
- Area — named clusters around campus, not GPS radius (Kakatiya, Vidyaranyapuri, Hunter Road)
- Vibe **[new in v2]** — Chill, Study, Group hangout, Date, Late night, Quick bite, Comfort
  food, Celebration. Distinct from craving: craving is what you want to eat, vibe is why
  you're going. Both are `text[]` tag filters; they don't interact.
- Student discount available
- Rating (once enough verified reviews exist)
- AC / non-AC
- Dine-in / takeaway / both
- Group size fit (good for 2 / good for a group of 8+)

Sort: trending today (most profile views in last 24h), price low-to-high, highest rated,
nearest (only when location is granted).

**Search** covers restaurants _and_ individual dishes **[new in v2]**. A student searching
"biryani" should get restaurants whose menu contains biryani, with the matching dish and its
price shown in the result — not just restaurants tagged biryani. This is a meaningfully
better search than the aggregators offer and it falls straight out of having menu data.

**"Find your perfect spot" quiz [new in v2].** Three or four taps — vibe, budget, group size
— that resolve to a pre-filled filter set. Entirely client-side, no schema, no persistence.
It exists because a blank filter panel is intimidating and a chip row is easy to ignore, and
it costs almost nothing.

**v1 shipping order:** craving chips + veg/non-veg + price bucket + open now first. Add vibe,
area, rating, and group-size filters once enough restaurants are listed that narrow searches
don't return empty results.

### 5.4 Location and distance **[new in v2]**

Area clusters remain the filter. Distance is a display-only enhancement: if the student
grants browser geolocation, restaurant cards and profiles show approximate straight-line
distance, and "nearest" becomes available as a sort. If they decline, everything works
exactly as before with distance hidden. Never block a flow on a location prompt, and never
ask for location on first load — ask when they tap "nearest".

Directions open the device's map app via a coordinate deep link. We don't render a map.

### 5.5 Live offers

- Owners post offers directly: title, description, discount text, expiry (defaults to
  end-of-day).
- Expired offers auto-hide. This is what keeps the data trustworthy compared to a stale
  Zomato listing, and it's the core promise.
- Students can flag an offer as expired or wrong — lightweight crowdsourced correction.

### 5.6 Events **[new in v2]**

Owners post events: title, description, type (live music, open mic, quiz night, screening,
food festival, other), start time, optional end time, optional cover image.

Events appear in three places: the restaurant profile, an "upcoming events" page, and a
calendar entry point on the homepage. Students who are logged in can mark themselves as
going, which is one of the two signals that feed the social layer.

Events are a natural fit for this audience and a clear differentiator — an aggregator built
for delivery has no reason to carry them, and a campus crowd plans evenings around them.
Past events auto-hide on the same sweep as expired offers.

### 5.7 Booking

- Requires student login.
- Student submits date/time, headcount, optional special request.
- Minimum lead time: cannot book less than 1 hour out.
- Reminder 30 minutes before, asking the student to confirm.
- Purpose is explicitly informational. This lets the owner know a group is likely coming; it
  does not manage or guarantee table allocation.
- If the student doesn't confirm, the booking is flagged as "likely no-show" rather than
  auto-cancelled — people miss notifications.
- No-show count tracked per student. Past a threshold, tighten their confirmation window
  (10 min instead of 30) rather than banning.

**Owners can leave a note on a booking [new in v2], but cannot accept, decline, or modify
it.** The prototype had an owner "modify booking" modal; it's deliberately not carried over.
The moment an owner can decline, the student reasonably believes a table is being held, and
the whole product becomes a reservation system we've explicitly said we're not building — as
well as a support burden the moment a table isn't there. A free-text note ("we're full until
9, happy to see you after") gives the owner the same practical control while keeping the
framing honest. Revisit only if owners specifically ask for it.

**Bookings are never visible to friends.** See §5.9.

### 5.8 Reviews

Gated to verified visits — a student who booked and didn't no-show can review. Sortable by
newest, highest, and lowest **[new in v2]**; the profile shows an aggregate rating and count.

### 5.9 Social layer **[new in v2]**

The prototype's best instinct was that deciding where to eat is a group decision. Kept, but
scoped tightly.

**Saved.** A student can save a restaurant. Private by default.

**Friends.** Mutual consent — one student sends a request, the other accepts. No follower
model, no public profiles, no discovery-by-browsing-other-people.

**Activity sharing is opt-in and off by default.** A student turns on activity sharing to let
their accepted friends see two things: which restaurants they've saved, and which events
they've marked themselves going to. That's the entire surface.

**Bookings are never shared, under any setting.** A booking has a time and a headcount and
often a special request; broadcasting it tells a friend where someone will physically be
tonight. On a campus where everyone knows everyone, that's a safety question, not a features
question. Saved and going-to-an-event are voluntary declarations of intent; a booking is a
private arrangement.

The payoff is a homepage row — "3 friends saved this" — and a "where the squad's going"
section. With ten users it's dead weight, which is why it ships last (see build plan Phase 9).

---

## 6. Key user flows

**Student — decide where to eat.** Open homepage → today's specials ticker → optionally tap
a craving chip or run the quiz → browse filtered results → open a profile → live offer +
student discount + menu + upcoming events → optionally book, save, or share.

**Owner — post a live offer.** Log in → dashboard → add offer → title, discount, expiry →
publish → appears immediately in the homepage feed.

**Owner — post an event.** Log in → dashboard → events → title, type, date/time, optional
image → publish → appears on the profile, the events page, and the calendar.

**Booking lifecycle.** requested → (must be ≥1hr out) → confirmed by system → 30-min-prior
reminder → student confirms → stays confirmed; or no response → unconfirmed / likely no-show.
Owner is notified either way and can leave a note at any point.

**Social.** Student A sends a friend request → B accepts → both turn on activity sharing →
A's saved list and event RSVPs become visible to B, and vice versa.

---

## 7. Success metrics for the testing period

- Restaurants with at least one live offer posted in the last 7 days — data freshness, the
  core promise.
- Weekly active students browsing, and booking conversion rate.
- **[new in v2]** Events posted per restaurant per month, and RSVP-to-attendance signal.
- Owner-reported qualitative feedback: does the analytics view change what they post?
- No-show rate, and whether the reminder flow measurably reduces it.
- **[new in v2]** Share of students who add at least one friend, and share who turn on
  activity sharing. If either is under about 20% after a month of the feature being live,
  cut the social layer rather than iterating on it.

---

## 8. Open questions

| Question                                          | Parked in                 | Decide before |
| ------------------------------------------------- | ------------------------- | ------------- |
| Exact NITW student email domain                   | `config/auth.ts`          | P4-1          |
| Area cluster boundaries                           | `config/areas.ts`         | P10-5         |
| Who approves owner signups                        | `docs/runbook.md`         | P4-5          |
| Craving tag list                                  | `config/cravings.ts`      | P3-3          |
| Price bucket ranges                               | `config/price-buckets.ts` | P3-4          |
| No-show threshold and tightened window            | `config/booking.ts`       | P6-9          |
| **[new]** Vibe tag list                           | `config/vibes.ts`         | P3-8          |
| **[new]** Event types                             | `config/events.ts`        | P5-9          |
| **[new]** Quiz questions and their filter mapping | `config/quiz.ts`          | P3-9          |
| **[new]** Friend limit, if any                    | `config/social.ts`        | P9-2          |
