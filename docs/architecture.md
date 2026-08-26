# Architecture — NITW Campus Food Discovery Platform (v2)

Supersedes v1. Additions marked **[v2]**.

---

## 1. Tech stack

| Layer          | Choice                                             | Why                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Next.js (App Router) + Tailwind                    | Fast to build, good defaults, clean deploys                                                                                                                                                               |
| Backend        | Supabase — Postgres, Auth, Storage, Edge Functions | Free tier covers the testing period; auth, DB and images in one place                                                                                                                                     |
| Hosting        | Netlify (Free)                                     | Auto-deploy from GitHub, preview URLs on PRs. **Chosen over Vercel Hobby, which is non-commercial only** — monetization is deferred, not ruled out, and this avoids a migration later at zero cost today. |
| Email (OTP)    | Resend free tier via Supabase Auth SMTP            | Supabase's built-in sender is rate-limited too low for real OTP volume                                                                                                                                    |
| Scheduled jobs | Supabase Edge Functions on `pg_cron`               | No separate infra                                                                                                                                                                                         |
| Images         | Supabase Storage buckets                           | 1GB free, served via CDN                                                                                                                                                                                  |

**[v2] Storage budget.** v1 needed a cover image per restaurant. v2 adds galleries, menu
photos, and event images — call it 15 images per restaurant. At 1GB free, that's roughly 130
restaurants at 500KB each. Fine for soft launch, but resize on upload (max 1600px wide,
WebP) rather than storing originals, or you'll hit the ceiling at 25 restaurants.

---

## 2. Data model

Enums are Postgres enum types, not text columns. All tables get `id uuid primary key default
gen_random_uuid()`, `created_at timestamptz default now()`, and RLS enabled in the same
migration.

```
users
  id                uuid (pk, = auth.users.id)
  role              enum('student','owner','admin')
  full_name         text
  email             text unique
  hostel            text            -- [v2] nullable, shown in friends list
  nitw_verified     boolean
  no_show_count     int default 0
  share_activity    boolean default false   -- [v2] opt-in, gates the social layer
  food_type         text            -- [v2] CHECK'd against config/food-preferences
  favorite_cuisines text[] not null default '{}'   -- [v2] free vocabulary, no CHECK
  spice_preference  text            -- [v2] CHECK'd: low | medium | high
  created_at        timestamptz

restaurants
  id                uuid (pk)
  owner_id          uuid (fk -> users.id)
  name              text
  description       text
  area              text            -- named cluster
  address           text
  lat, lng          numeric         -- [v2] now required, drives directions + distance
  phone             text            -- [v2]
  is_veg_only       boolean
  has_ac            boolean
  dine_in           boolean
  takeaway          boolean
  student_discount  boolean
  price_per_head    int
  vibe_tags         text[]          -- [v2] ['chill','study'] — powers the vibe filter
  opening_hours     jsonb           -- [v2] see below
  cover_image_url   text
  status            enum('pending_approval','active','suspended')
  created_at        timestamptz

menu_items
  id                uuid (pk)
  restaurant_id     uuid (fk)
  name              text
  price             int
  is_veg            boolean
  craving_tags      text[]
  is_available      boolean default true
  created_at        timestamptz

offers
  id                uuid (pk)
  restaurant_id     uuid (fk)
  title             text
  description       text
  discount_text     text
  starts_at         timestamptz
  expires_at        timestamptz     -- defaults to end-of-day
  is_active         boolean         -- swept by cron
  flagged_count     int default 0
  created_at        timestamptz

bookings
  id                uuid (pk)
  student_id        uuid (fk -> users.id)
  restaurant_id     uuid (fk)
  headcount         int
  special_request   text
  booking_time      timestamptz
  status            enum('requested','confirmed','unconfirmed','completed','cancelled')
  reminder_sent_at  timestamptz
  confirmed_at      timestamptz
  owner_note        text            -- [v2] owner can annotate, cannot accept/decline
  owner_note_at     timestamptz     -- [v2]
  created_at        timestamptz

reviews
  id                uuid (pk)
  booking_id        uuid (fk, unique)   -- ties review to a verified visit
  student_id        uuid (fk)
  restaurant_id     uuid (fk)
  rating            int                 -- 1-5
  comment           text
  created_at        timestamptz

profile_views
  id                uuid (pk)
  restaurant_id     uuid (fk)
  viewer_id         uuid (fk, nullable)
  source_filter     text            -- 'craving:biryani', 'homepage_feed', 'search',
                                    -- 'quiz', 'events', 'friend_activity'   [v2]
  created_at        timestamptz
```

### New tables **[v2]**

```
restaurant_photos
  id                uuid (pk)
  restaurant_id     uuid (fk)
  url               text
  kind              enum('gallery','menu_photo')
  sort_order        int default 0
  created_at        timestamptz

events
  id                uuid (pk)
  restaurant_id     uuid (fk)
  title             text
  description       text
  event_type        enum('live_music','open_mic','quiz','screening','food_festival','other')
  starts_at         timestamptz
  ends_at           timestamptz     -- nullable
  cover_image_url   text            -- nullable
  is_cancelled      boolean default false
  created_at        timestamptz

event_rsvps
  id                uuid (pk)
  event_id          uuid (fk -> events.id)
  student_id        uuid (fk -> users.id)
  created_at        timestamptz
  unique (event_id, student_id)

saved_restaurants
  id                uuid (pk)
  student_id        uuid (fk -> users.id)
  restaurant_id     uuid (fk -> restaurants.id)
  created_at        timestamptz
  unique (student_id, restaurant_id)

friendships
  id                uuid (pk)
  requester_id      uuid (fk -> users.id)
  addressee_id      uuid (fk -> users.id)
  status            enum('pending','accepted','blocked')
  responded_at      timestamptz
  created_at        timestamptz
  unique (requester_id, addressee_id)
  check (requester_id <> addressee_id)
```

**Friendship symmetry.** One row per pair, not two. Queries go through a view:

```sql
create view friend_edges as
  select requester_id as user_id, addressee_id as friend_id from friendships where status = 'accepted'
  union all
  select addressee_id, requester_id from friendships where status = 'accepted';
```

Every RLS policy and query touching the social layer reads `friend_edges`, never
`friendships` directly. Getting this wrong in one place is how you leak someone's saved list
to a stranger.

To stop A→B and B→A both existing, add a canonical-order constraint or a unique index on
`least(requester_id, addressee_id), greatest(...)`.

### `opening_hours` shape **[v2]**

```json
{
  "mon": [{ "open": "11:00", "close": "23:00" }],
  "tue": [{ "open": "11:00", "close": "23:00" }],
  "sat": [{ "open": "11:00", "close": "02:00" }],
  "sun": []
}
```

An array per day so split shifts work (lunch close, dinner reopen), which is common here.
An empty array means closed that day. A `close` earlier than its `open` means it runs past
midnight. Times are local wall-clock in `Asia/Kolkata` — do not store these as timestamptz.

Compute "open now" in a SQL function, not in the client, so the filter and the badge can't
disagree:

```sql
create function is_open_now(hours jsonb, at timestamptz default now())
returns boolean language sql stable as $$ ... $$;
```

---

## 3. Auth design

**Students.** Supabase Auth email OTP, restricted to the NITW domain at the `/signup` route
before triggering the send, plus a Postgres check function as a second layer. Sets
`nitw_verified = true` on confirm.

**Owners.** Email/password via Supabase Auth. `restaurants.status` starts at
`pending_approval` and stays invisible to students until an admin flips it to `active`, done
manually in the Supabase table editor during testing.

### RLS — on from day one

| Table                                 | Policy                                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restaurants`, `menu_items`, `offers` | insert/update where `owner_id = auth.uid()` (via join for the latter two). Public read only where `status = 'active'` / `is_active = true`.                                               |
| `restaurant_photos` **[v2]**          | owner writes via join; public read where parent restaurant is active                                                                                                                      |
| `events` **[v2]**                     | owner writes via join; public read where parent active and not cancelled                                                                                                                  |
| `event_rsvps` **[v2]**                | student inserts/deletes own; readable by self, by the owner of the event's restaurant (aggregate count), and by accepted friends **only when the RSVP owner has `share_activity = true`** |
| `bookings`                            | students insert/read own; owners read bookings for restaurants they own; owners may update `owner_note` only. **Never readable by friends.**                                              |
| `reviews`                             | insert only if the referenced `booking_id` belongs to `auth.uid()` and status is `completed`                                                                                              |
| `saved_restaurants` **[v2]**          | student full access to own; readable by accepted friends only when the owner has `share_activity = true`                                                                                  |
| `friendships` **[v2]**                | readable and writable only by the two parties; a pending request is visible to the addressee                                                                                              |
| `profile_views`                       | insert-only for public; owner reads own restaurant's rows                                                                                                                                 |

**Public unauthenticated read:** `restaurants`, `menu_items`, `offers`, `restaurant_photos`,
`events` — browsing must not require login.

**RLS guards rows, not columns.** `users update own profile` is `using (id = auth.uid())`,
which says nothing about _which_ columns a student may write — and a server action's parameter
types are erased at runtime. So every student self-write goes through the allowlist in
`lib/domain/student-preferences.ts`, which is the only thing standing between a crafted action
payload and `role = 'owner'` or `nitw_verified = true` on the caller's own row. Any new
student-writable column belongs on that list; nothing else may be forwarded to `.update()`.

**The two policies most likely to be wrong**, so test them explicitly with three accounts
(a friend, a non-friend, and a friend with sharing off):

```sql
create policy "friends read saved when shared" on saved_restaurants for select using (
  student_id = auth.uid()
  or (
    exists (select 1 from friend_edges fe
            where fe.user_id = auth.uid() and fe.friend_id = saved_restaurants.student_id)
    and exists (select 1 from users u
                where u.id = saved_restaurants.student_id and u.share_activity = true)
  )
);
```

Both halves are required. Friendship alone isn't consent, and `share_activity` alone isn't
either.

---

## 4. Booking state machine

```
requested
  │ (validated: booking_time - now >= 1 hour, client AND server)
  ▼
confirmed  (system-level: "accepted into the queue", not "table held")
  │ at booking_time - 30min → reminder sent, reminder_sent_at set
  ▼
  ├─ student confirms within the window → confirmed_at set → stays 'confirmed'
  └─ no response by booking_time → 'unconfirmed', owner sees "likely no-show",
                                    users.no_show_count += 1
After booking_time passes → 'completed' (whether confirmed or unconfirmed),
which unlocks review-write permission for that booking.
```

**Unchanged in v2.** The prototype's owner "modify booking" flow is deliberately not adopted
— see PRD §5.7. Owners write `owner_note` and nothing else; no owner action changes `status`.
This keeps `booking-flow`'s enforceable state machine intact.

The 1-hour check happens at insert time on both client and server. The 30-minute reminder and
the resolution sweep are Edge Functions on a `pg_cron` schedule running every 5 minutes.

---

## 5. Scheduled jobs

One Edge Function, one cron entry per concern:

| Job                      | Cadence      | Does                                                                                          |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------------- |
| `reminders`              | every 5 min  | finds bookings crossing `booking_time - 30min`, sends email, sets `reminder_sent_at`          |
| `resolve-bookings`       | every 5 min  | past `booking_time` with no confirm → `unconfirmed` → `completed`, increments `no_show_count` |
| `expire-offers`          | every 15 min | flips `is_active = false` past `expires_at`                                                   |
| `expire-events` **[v2]** | hourly       | hides events past `ends_at` (or `starts_at + 4h` when null)                                   |
| `keep-alive`             | daily        | trivial query so the free-tier project doesn't pause                                          |

---

## 6. Analytics approach

Every profile view writes a `profile_views` row tagged with `source_filter` — the chip,
search term, or entry point the student arrived through. **[v2]** adds `quiz`, `events`, and
`friend_activity` as sources, which is the interesting part: it tells an owner whether posting
an event actually brought people to their page.

Owner dashboard aggregates: total views over 7/30 days, breakdown by `source_filter`, and a
trending flag from 24h view velocity. Simple event table plus SQL views for v1 — no separate
analytics service at this scale.

Copy rule, unchanged and important: this is profile views, not footfall. The UI must say so.

---

## 7. Folder structure

```
/app
  /(public)
    /page.tsx                     homepage: ticker, craving picker, feed
    /search/page.tsx              restaurants + dishes
    /restaurant/[id]/page.tsx
    /events/page.tsx              [v2]
    /quiz/page.tsx                [v2]
  /(student)
    /login/page.tsx
    /account/page.tsx             profile, taste map, sharing
    /bookings/page.tsx
    /reviews/page.tsx             what this student has written
    /saved/page.tsx               [v2]
    /friends/page.tsx             [v2]
  /(owner)
    /owner/login/page.tsx
    /owner/dashboard/page.tsx
    /owner/menu/page.tsx
    /owner/offers-events/page.tsx offers + events, one page
    /owner/offers/page.tsx        → redirects to offers-events
    /owner/events/page.tsx        → redirects to offers-events   [v2]
    /owner/photos/page.tsx        [v2]
    /owner/bookings/page.tsx
    /owner/analytics/page.tsx     views + reviews, one page
    /owner/reviews/page.tsx       → redirects to analytics
  /api
    /bookings/route.ts
    /offers/route.ts
    /events/route.ts              [v2]
    /cron/[job]/route.ts
  /dev/components/page.tsx        kitchen sink
/components
  /ui                             Chip, Card, Button, MenuRow, Sheet, Skeleton
  /features                       CravingChips, RestaurantCard, MenuList, OfferBadge,
                                  EventCard, FriendRow, SaveToggle, Quiz
/lib
  /supabase/{client,server}.ts
  /queries                        one file per entity — the ONLY place Supabase is called
  /domain/booking.ts              pure functions, unit tested
  /domain/hours.ts                [v2] open-now logic, unit tested, mirrors the SQL function
  /domain/distance.ts             [v2] haversine, pure
/config
/types/db.ts                      generated
/docs
/supabase/migrations
```

---

## 8. Known limitations to revisit post-testing

- Free-tier projects pause after 7 days of inactivity — keep-alive ping is in the cron list.
- No automated backups on free tier — periodic manual export once real data exists.
- Reminders rely on email. If usage grows, PWA push or WhatsApp would reduce misses. v2 cost,
  not v1.
- **[v2]** `opening_hours` has no holiday or one-off-closure override. Owners will ask for
  this. A `closures` table with a date range is the fix; not v1.
- **[v2]** Distance is straight-line, not walking distance. Fine at campus scale, misleading
  if the platform ever covers the wider city.
- **[v2]** The friend graph has no block-and-hide beyond the `blocked` status. If the social
  layer sees real use, that needs a proper review before scaling past the pilot.
