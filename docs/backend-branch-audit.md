# backend-branch → main: migration audit

Audit only. No code changed. Produced on 2026-08-24.

- `main` @ `49859e8` — authoritative for architecture and behavior
- `origin/backend-branch` @ `56fb89c` — reference spec for features
- merge base: `238584e` ("unblock dev scripts for a fresh Supabase project")

## Headline finding

**`backend-branch` forked from `main` at `238584e` and never received any of
main's last 7 commits.** It is `main@238584e` + an Express API + a
localStorage auth rewrite. Because the fork is older, the branch *reverts* every
fix main has landed since:

| main commit | Fix | backend-branch state |
| --- | --- | --- |
| `1c3d40b` | public Sites deployment via vinext | reverted to open-next |
| `0d9725e` | dev project online / owner login | partially reverted |
| `96b8171` | student login code-only | reverted (`magic_link.html` deleted) |
| `a324e06` | scope owners to their own portal | **reverted** |
| `f709ddd` | LAN + tunnel hosts reach `next dev` | reverted |
| `23b0565` | login template stops emitting live magic link | **reverted** (template deleted) |

Second finding: **the Express backend is a port of main's own logic, not new
logic.** The backend files say so in their own header comments (e.g.
`backend/src/lib/view/summary.js`: *"ported from lib/queries/catalog.ts"*).
Main's implementations are consistently larger and more complete:

| Domain | main | backend-branch |
| --- | --- | --- |
| catalog reads | `lib/queries/catalog.ts` — 547 lines | `lib/view/catalog.js` — 61 lines |
| opening hours | `lib/domain/hours.ts` — 244 lines | `lib/domain/hours.js` — 91 lines |
| booking rules | `lib/domain/booking.ts` — 195 lines | `lib/domain/booking.js` — 122 lines |
| owner writes | `lib/owner/actions.ts` — 324 lines | `owner.controller.js` — 251 lines |

Third finding: **only one domain is genuinely absent from main — the admin
console.** Everything else in `backend-branch` already exists in `main`, usually
in a more complete form. Features I checked specifically for and found already
present in main: `alsoLike`, `searchDishes`, `event_interest_counts`, Resend
reminder emails, profile-view logging, cron sweeps.

Baseline verified on `main`: `npm test` → **55 passed / 4 files**;
`npm run typecheck` → **clean**.

## Blockers that must never be merged

1. **`destiny-c` gitlink** — `160000 commit 49859e8… destiny-c`. The repo is
   committed inside itself, with no `.gitmodules`. Must not reach main.
2. **`middleware.ts` deleted** — main's Supabase session-cookie refresh. Removing
   it is what forces the entire localStorage rewrite.
3. **Student nav moved into the root layout** — `app/layout.tsx` gains
   `<MobileTabBar />`. Main's layout carries an explicit comment forbidding this:
   *"No nav here on purpose … owner pages ship their own nav and used to inherit a
   tab bar full of routes they cannot open."* This reintroduces the exact bug
   `a324e06` fixed, and would also apply student nav to the new admin pages.
4. **Server-side route guards become client-side** — `requireOwner()` in the owner
   layout is replaced by `<AuthGuard role="owner">`, which only runs after mount.
   Protected content is server-rendered and shipped before the check runs.
5. **Build/deploy rollback** — `vinext` → `@opennextjs/cloudflare`;
   `vite.config.ts` deleted; `open-next.config.ts` restored; `wrangler.jsonc`
   retargeted to `.open-next/worker.js`; `"type": "module"` dropped from
   `package.json`; `.vinext/` and `.wrangler/` removed from `.gitignore`.
6. **Session tokens in `localStorage`** — `lib/session/store.ts` persists both
   access and refresh tokens under `destiny.session`, readable by any XSS. Main's
   httpOnly cookies are strictly safer.
7. **`types/db.ts` regenerated older** — drops the `graphql_public` schema block.

## Feature migration matrix

| # | Feature | backend-branch | main today | Action | Class | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Express app foundation (`createApp`, CORS, error envelope, `/health`) | Present | Absent | Add only if an HTTP API is actually wanted | SAFE_NEW_FEATURE | Low |
| 2 | **Admin console** (overview, restaurant approval, roles, offer/review moderation) | Present, 296-line controller + 10 endpoints | **Absent entirely** | **Reimplement in main's architecture** | REIMPLEMENT_REQUIRED | Medium |
| 3 | Restaurants / detail / also-like | Ported subset | `lib/queries/catalog.ts`, richer | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 4 | Search index + dishes | Ported subset | `searchDishes` present | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 5 | Offers ticker + flag | Ported | `lib/offers/actions.ts` + `flag_offer` RPC | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 6 | Events + interest counts + RSVP | Ported | `event_interest_counts` view present | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 7 | Bookings (create/list/confirm/cancel/respond/note) | 7 endpoints | `lib/bookings/actions.ts`, `app/api/bookings/route.ts`, 195-line domain | Keep main; diff rules for gaps | MAIN_ALREADY_HAS_BETTER_VERSION | Medium |
| 8 | Saved restaurants | Ported | `lib/social/actions.ts` | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 9 | Reviews | Ported | `lib/reviews/actions.ts` | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 10 | Friends / social / friend activity | 7 endpoints | `lib/queries/social.ts` + actions | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | Low |
| 11 | Owner console (bundle, menu, offers, events, photos, analytics) | 13 endpoints | `lib/owner/actions.ts` + `lib/queries/owner.ts` | Keep main | MAIN_ALREADY_HAS_BETTER_VERSION | High |
| 12 | Cron sweeps + reminder email | Ported | `app/api/cron/[job]/route.ts` | Keep main | DUPLICATE_OR_UNNECESSARY | Low |
| 13 | Profile-view logger | Ported | `app/api/profile-view/route.ts` | Keep main | DUPLICATE_OR_UNNECESSARY | Low |
| 14 | **`admin/` standalone Vite app** | 23 files, React 18 | — | **Do not migrate** (see below) | DUPLICATE_OR_UNNECESSARY | Low |
| 15 | `lib/api/*` HTTP client + `useApi` | 15 files | Server Actions | Only needed if #1 is adopted | ARCHITECTURAL_CONFLICT | High |
| 16 | `lib/session/*` localStorage auth | 4 files | Supabase SSR cookies + middleware | **Do not migrate** | ARCHITECTURAL_CONFLICT | Critical |
| 17 | `*View.tsx` client rewrites (21 files) | Present | Server Components | Do not migrate | ARCHITECTURAL_CONFLICT | High |
| 18 | `AuthGuard`, `OwnerBundleGate` | Present | Server-side `requireOwner()` | Do not migrate | ARCHITECTURAL_CONFLICT | High |
| 19 | `AsyncStates` loading/error scaffolding | Present | — | Optional cherry-pick if client fetching appears | SAFE_NEW_FEATURE | Low |
| 20 | Build/deploy config | open-next | vinext | Keep main | ARCHITECTURAL_CONFLICT | Critical |
| 21 | `middleware.ts` deletion | Deleted | Present | Keep main | ARCHITECTURAL_CONFLICT | Critical |
| 22 | Root-layout `MobileTabBar` | Present | Deliberately absent | Keep main | ARCHITECTURAL_CONFLICT | High |
| 23 | `destiny-c` gitlink | Present | — | Never migrate | DUPLICATE_OR_UNNECESSARY | Critical |
| 24 | `SiteNav` `accountHref` threading | Present | Hardcoded in drawer | Small genuine improvement — reconcile | MANUAL_RECONCILIATION | Low |

### On #14, the `admin/` directory

It is not an admin console. `admin/package.json` names it `destiny-partners`,
described as *"Restaurant management platform for offers, events, bookings, and
menu management"* — an **owner** dashboard. It has its own fake
login/signup against `localStorage` (`admin/src/components/Auth.jsx`,
`admin/src/utils/storage.js` with a `Demo` seed), React 18 + Vite 5 + chart.js,
and never talks to the Express API. It duplicates main's owner portal as a mock.
Same genre as main's existing `prototypes/minimal-home-reference`. If it is worth
keeping at all, it belongs under `prototypes/` — not as a second deployed app.

### On #17, the client rewrites

These are not features. Their own headers say why they exist:

- `ReviewPrompt.tsx` — *"used to be computed on the server from the student's bookings. With the session now in the browser…"*
- `RestaurantPortalLink.tsx` — *"The Next server no longer holds the session"*
- `AsyncStates.tsx` — *"authed views that used to be Server Components"*

Every one is compensation for deleting `middleware.ts`. Keep main's architecture
and none are needed.

## Endpoint inventory (61 total)

Only the **admin** group has no equivalent in main.

| Group | Count | Endpoints | main equivalent |
| --- | --- | --- | --- |
| health | 1 | `GET /health` | n/a |
| auth | 8 | `POST /auth/student/otp`, `/student/verify`, `/owner/login`, `/owner/signup`, `/refresh`, `/logout`; `GET /auth/me`; `PATCH /auth/profile` | `lib/auth/actions.ts` |
| restaurants | 4 | `GET /restaurants`, `/:id`, `/:id/also-like`; `POST /:id/save` | `lib/queries/catalog.ts` |
| offers | 2 | `GET /offers/ticker`; `POST /offers/:id/flag` | `lib/offers/actions.ts` |
| search | 2 | `GET /search/index`, `/search/dishes` | `lib/queries/catalog.ts` |
| events | 4 | `GET /events`, `/interest-counts`, `/:id`; `POST /:id/rsvp` | `lib/queries/catalog.ts`, `lib/social/actions.ts` |
| bookings | 7 | `POST /bookings`; `GET /bookings`, `/:id`; `POST /:id/confirm`, `/:id/cancel`, `/:id/respond`; `PATCH /:id/note` | `lib/bookings/actions.ts` |
| reviews | 1 | `POST /reviews` | `lib/reviews/actions.ts` |
| social | 7 | `GET /social/saved`, `/friends`, `/rsvps`, `/friend-activity`; `POST /friends`, `/friends/:id/respond`; `DELETE /friends/:id` | `lib/social/actions.ts` |
| owner | 13 | `GET /owner/bundle`, `/bookings`, `/analytics`; `POST/PATCH /owner/restaurant`; `POST /owner/menu`, `DELETE /menu/:id`; `POST /owner/offers`, `PATCH /offers/:id`; `POST /owner/events`; `POST /owner/photos`, `/photos/reorder`, `DELETE /photos/:id` | `lib/owner/actions.ts` |
| **admin** | **10** | `GET /admin/overview`, `/restaurants`, `/users`, `/offers/flagged`, `/reviews`; `POST /restaurants/:id/status`, `/offers/:id/moderate`; `PATCH /users/:id`; `DELETE /offers/:id`, `/reviews/:id` | **none** |
| views | 1 | `POST /views` | `app/api/profile-view/route.ts` |
| cron | 1 | `POST /cron/:job` | `app/api/cron/[job]/route.ts` |

## Database review

**No migrations are required for the admin console.** Main's `types/db.ts`
already has everything the admin controller reads:

- `user_role: 'student' | 'owner' | 'admin'` — the `admin` role exists
- `restaurant_status` covering `pending_approval` / `active` / `suspended`
- `offers.flagged_count: number`
- tables: `users`, `restaurants`, `bookings`, `offers`, `events`, `reviews`

One real gap to note: the schema has **no admin RLS policies** — deliberately, per
the backend's own comment. So admin reads/writes must run on the service-role
client, and the role check is the *only* security boundary. In main that means the
check belongs in a server-only module (`lib/supabase/admin.ts` is already the
sanctioned service-key consumer) and must be re-verified on every request, never
inferred from the UI.

## Environment variables

Existing main variables — all still required, none to be removed:

| Variable | Side | Required | Secret | Purpose |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | frontend | yes | no | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | frontend | yes | no | public Supabase key |
| `SUPABASE_SECRET_KEY` | server | yes | **yes** | service-role; cron + admin only |
| `RESEND_API_KEY` | server | optional | **yes** | reminder emails |
| `CRON_SECRET` | server | yes | **yes** | guards cron sweeps |
| `SITE_URL` | server | optional | no | absolute origin in emails |
| `DEV_ORIGINS` | dev | optional | no | extra `next dev` origins — **do not drop** |
| `SUPABASE_PROJECT_REF` | dev scripts | yes | no | dev project guard |

Only needed if the Express API is adopted (#1): `NEXT_PUBLIC_API_URL`,
`ALLOWED_ORIGIN`, `PORT`, plus backend copies of `SUPABASE_URL` /
`SUPABASE_ANON_KEY` / `SUPABASE_SECRET_KEY`.

`backend-branch` deletes `DEV_ORIGINS` from `.env.example`. Merge additively; do
not replace the file.

## Semantic conflicts (merge cleanly, behave worse)

1. Student `MobileTabBar` becomes global → owner and admin pages inherit
   unreachable student nav. Regresses `a324e06`.
2. `requireStudent`/`requireOwner` lose role-aware redirects → a logged-in owner
   hitting a student route lands on `/login` and reads as a forced logout. This is
   the precise bug `a324e06` fixed.
3. Route protection moves from server to client → protected markup ships before
   the guard runs.
4. `middleware.ts` removed → no session refresh; server components can no longer
   see a session at all.
5. Build pipeline silently downgraded from vinext to open-next.
6. `magic_link.html` deleted + its `config.toml` block removed → student login can
   emit a live magic link again. Regresses `23b0565`.
7. `supabase/config.toml` loses the warning block about `config push` overwriting
   hosted Auth settings — a documented footgun becomes undocumented.
8. `types/db.ts` replaced with an older generation.

## Recommended plan

The original 7-session plan assumed the Express backend carried missing features.
It does not — it carries a re-plumbing of logic main already has, wrapped in an
architecture main deliberately moved away from. Executing phases 2–5 as written
would rewrite ~21 working Server Components into client components, delete
`middleware.ts`, and revert 6 shipped fixes, for no new user-facing capability.

Suggested revision:

1. **Admin console in main's architecture** — the one genuine gap. New
   `app/(admin)/admin/*` Server Components under a server-side `requireAdmin()`,
   reusing `lib/supabase/admin.ts`, with logic ported from
   `admin.controller.js` (its validation is sound: status/role allowlists,
   `safeLike` PostgREST sanitizing, self-demotion block). No migrations needed.
2. **Cherry-pick the small wins** — `SiteNav` `accountHref` threading (#24);
   `AsyncStates` only if client fetching is introduced.
3. **Diff the ported business logic for genuine divergences** — read
   `bookings.controller.js` and `owner.controller.js` against main's actions and
   port any *rule* main lacks. Cheap, low-risk, no architecture change.
4. **Optionally park `admin/`** under `prototypes/` if the mock has design value.
5. **Only then**, decide whether a standalone Express API is wanted *as a goal in
   itself* (e.g. to serve a future mobile client). If yes, add it additively
   alongside the Server Actions and validate Supabase JWTs from main's existing
   cookie session — never move the session into `localStorage`.

Auth migration (#16) should not proceed. Main's httpOnly-cookie SSR session is
both safer and more capable than the localStorage model, and the backend's
`userClient(jwt)` design can already accept a token minted from main's session if
an API is ever needed.
