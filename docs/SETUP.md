# Project Setup — NITW Campus Food Discovery Platform

Phase 0 from `build-plan.md`, expanded into commands you can run. One working session,
everyone in the same room, before anyone splits off.

The design system and scope questions from the earlier draft are now resolved — see
`docs/design.md` (dark, v2) and `prd.md` v2. What's left is mechanical.

---

## Step 1 — Repo and scaffold (P0-1)

```bash
npx create-next-app@latest destiny \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias "@/*"
cd destiny
npm i -D prettier prettier-plugin-tailwindcss vitest
```

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```bash
git init && git add -A && git commit -m "P0-1: scaffold"
gh repo create destiny --private --source=. --push
```

Protect `main` immediately: Settings → Branches → require a PR, require one approval.

**Done when:** `npm run dev` serves and `npm run lint` passes.

---

## Step 2 — Folder skeleton

```bash
mkdir -p \
  "app/(public)/search" "app/(public)/restaurant/[id]" "app/(public)/events" "app/(public)/quiz" \
  "app/(student)/login" "app/(student)/bookings" "app/(student)/saved" "app/(student)/friends" \
  "app/(owner)/owner"/{login,dashboard,menu,offers,events,photos,bookings,analytics} \
  app/api/{bookings,offers,events} "app/api/cron/[job]" app/dev/components \
  components/{ui,features} lib/{supabase,queries,domain} \
  config types docs supabase/migrations
```

The rule that matters most: **nothing in `/components` imports `@supabase/supabase-js`.**
Enforce it so it fails in CI rather than in review — `.eslintrc.json`:

```json
{
  "extends": "next/core-web-vitals",
  "overrides": [
    {
      "files": ["components/**/*.tsx"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": ["@supabase/*", "@/lib/supabase/*"]
          }
        ]
      }
    }
  ]
}
```

---

## Step 3 — Design tokens (P0-2)

Tailwind v4 is configured in CSS. In `app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  --color-canvas: #14161f;
  --color-surface-muted: #1d2029;
  --color-surface-raised: #262a36;
  --color-border-hairline: #2e3340;
  --color-paper: #f3eee2;
  --color-text-muted: #a29b96;
  --color-accent-primary: #ffc229;
  --color-accent-secondary: #6fbf8b;
  --color-accent-urgent: #e8432b;
  --color-accent-urgent-text: #f2604b;

  --font-display: 'Roboto Slab', Georgia, serif;
  --font-body: 'Inter', ui-sans-serif, system-ui;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --radius-chip: 999px;
  --radius-card: 14px;
  --radius-control: 12px;
}

html {
  background: var(--color-canvas);
  color-scheme: dark;
}
```

Load the three fonts with `next/font/google` in `app/layout.tsx`, not a `<link>` — it
self-hosts them and removes the render-blocking request.

**Done when:** `bg-canvas`, `text-paper`, `font-display` all resolve, and
`git grep -nE "#[0-9A-Fa-f]{6}" -- 'app' 'components'` returns only `globals.css`.

---

## Step 4 — Supabase (P0-3)

```bash
npm i @supabase/supabase-js @supabase/ssr
npm i -D supabase
```

### 4.1 Create the two projects

1. Go to supabase.com, sign in with GitHub — same account that owns the repo, it saves a
   linking step later.
2. **New project**. Name it `destiny-dev`. Pick an organization (the free one you get by
   default is fine).
3. **Database password**: it generates one. Copy it into your password manager _now_. You
   won't be shown it again, and you need it for direct `psql` access and for
   `supabase db push` if you ever link without the access token.
4. **Region**: Mumbai / `ap-south-1`. Everything else adds ~150ms per query for no reason.
5. **Plan**: Free.
6. Wait about two minutes while it provisions.
7. Repeat all of the above for `destiny-prod`. Two projects is the free-tier limit, so this
   uses your whole allowance — that's intended.

### 4.2 Where each variable comes from

In the project dashboard, the **Connect** button in the top bar shows most of these. For
individual keys, go to **Settings → API Keys**.

| Variable                               | Where                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Settings → API Keys (or the Connect dialog). Looks like `https://abcdefgh.supabase.co`.                                                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API Keys → **Publishable key**. Starts `sb_publishable_`. If your project only shows a Legacy tab, click **Create new API keys** first. |
| `SUPABASE_SECRET_KEY`                  | Settings → API Keys → **Secret keys**. Starts `sb_secret_`. Reveal, copy once, store it.                                                           |
| `RESEND_API_KEY`                       | resend.com → sign up → API Keys → Create. Starts `re_`. Not needed until P4-1; leave it empty for now.                                             |
| `CRON_SECRET`                          | You invent it. `openssl rand -hex 32`. It's the shared secret your cron routes check so nobody else can trigger your sweeps.                       |

**Use the new key format, not `anon` and `service_role`.** Supabase replaced them with
publishable and secret keys; the legacy pair is deprecated at the end of 2026, which is
inside this project's life. If your dashboard shows both, take the new ones. The mapping is
one to one — publishable does what anon did, secret does what service_role did.

### 4.3 The env files

`.env.local`, never committed:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
RESEND_API_KEY=
CRON_SECRET=
```

Commit a `.env.example` with the same keys and empty values so a new machine knows what it
needs.

Confirm `.env.local` is ignored before your first push:

```bash
git check-ignore -v .env.local
```

If that prints nothing, it is **not** ignored — add it to `.gitignore` before committing
anything.

**The secret key is server-only.** Anything prefixed `NEXT_PUBLIC_` is compiled into the
browser bundle by Next.js, which is why the publishable key carries that prefix and the
secret key must never be given one. If `SUPABASE_SECRET_KEY` is ever read in a file
containing `"use client"`, you've handed the browser a key that bypasses every RLS policy
you wrote. That's the single most common way a Supabase project gets breached.

### 4.4 Clients

`lib/supabase/client.ts` uses `createBrowserClient` with the URL and publishable key.
`lib/supabase/server.ts` uses `createServerClient` with cookie handling. A third helper,
`lib/supabase/admin.ts`, uses the secret key — create it only when a cron route actually
needs it (P5-10), not now.

### 4.5 Link the CLI

```bash
npx supabase login
```

That opens a browser and writes an access token to your machine. Then, from the dev
project's dashboard URL (`supabase.com/dashboard/project/<ref>`), take the ref:

```bash
npx supabase link --project-ref <dev-ref>
```

Link to **dev**, not prod. Everyone on the team links to the same dev project. Prod gets
touched only by the migration owner, at release time.

**Done when:** a server component runs a trivial query and renders the result, and
`git check-ignore .env.local` confirms the file is ignored.

---

## Step 5 — `/config` placeholders (P0-5)

Nine files, all imported by nothing yet. Each carries a comment naming the PRD question it
closes.

`config/auth.ts`

```ts
// PRD §8: exact NITW student email domain. Decide before P4-1.
export const STUDENT_EMAIL_DOMAINS = ['student.nitw.ac.in'] as const; // PLACEHOLDER
export const isStudentEmail = (email: string) =>
  STUDENT_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(`@${d}`));
```

`config/booking.ts`

```ts
// PRD §5.7. Change these, not the call sites.
export const BOOKING = {
  minLeadTimeMinutes: 60,
  reminderWindowMinutes: 30,
  tightenedReminderWindowMinutes: 10,
  noShowThreshold: 3, // PLACEHOLDER — decide before P6-10
} as const;
```

`config/cravings.ts`

```ts
// PRD §5.3. What you want to eat. Extend freely — not load-bearing.
export const CRAVINGS = [
  { tag: 'biryani', label: 'Biryani', emoji: '🍛' },
  { tag: 'momos', label: 'Momos', emoji: '🥟' },
  { tag: 'chai', label: 'Chai', emoji: '☕' },
  { tag: 'icecream', label: 'Ice cream', emoji: '🍦' },
] as const;
export type CravingTag = (typeof CRAVINGS)[number]['tag'];
```

`config/vibes.ts`

```ts
// PRD §5.3. Why you're going — orthogonal to cravings. Decide before P3-8.
export const VIBES = [
  { tag: 'chill', label: 'Chill' },
  { tag: 'study', label: 'Study' },
  { tag: 'group', label: 'Group hangout' },
  { tag: 'date', label: 'Date' },
  { tag: 'latenight', label: 'Late night' },
  { tag: 'quick', label: 'Quick bite' },
] as const;
export type VibeTag = (typeof VIBES)[number]['tag'];
```

`config/price-buckets.ts`

```ts
// PRD §5.3, ₹ per head. max = null means open-ended.
export const PRICE_BUCKETS = [
  { key: 'under100', label: 'Under ₹100', min: 0, max: 100 },
  { key: '100to200', label: '₹100–200', min: 100, max: 200 },
  { key: '200to400', label: '₹200–400', min: 200, max: 400 },
  { key: '400plus', label: '₹400+', min: 400, max: null },
] as const;
```

`config/areas.ts`

```ts
// PRD §8: cluster boundaries. Map the real clusters before P10-5.
export const AREAS = ['Kakatiya', 'Vidyaranyapuri', 'Hunter Road'] as const; // PLACEHOLDER
export type Area = (typeof AREAS)[number];
```

`config/events.ts`

```ts
// PRD §5.6. Must stay in sync with the Postgres event_type enum — changing this
// list requires a migration. Decide before P5-9.
export const EVENT_TYPES = [
  { key: 'live_music', label: 'Live music' },
  { key: 'open_mic', label: 'Open mic' },
  { key: 'quiz', label: 'Quiz night' },
  { key: 'screening', label: 'Screening' },
  { key: 'food_festival', label: 'Food festival' },
  { key: 'other', label: 'Other' },
] as const;
```

`config/quiz.ts`

```ts
// PRD §5.3. Pure client-side; answers resolve to a filter set. Decide before P3-9.
export const QUIZ = [
  { id: 'vibe', question: "What's the plan?", maps: 'vibe' },
  { id: 'budget', question: 'Budget per head?', maps: 'priceBucket' },
  { id: 'group', question: 'How many of you?', maps: 'groupSize' },
] as const;
```

`config/social.ts`

```ts
// PRD §5.9. Sharing is OFF by default and that default is a privacy decision,
// not a preference — don't flip it without a decisions.md entry.
export const SOCIAL = {
  shareActivityDefault: false,
  maxFriends: 150, // PLACEHOLDER — decide before P9-2
  sharedSignals: ['saved', 'event_rsvp'] as const, // bookings are never shared
} as const;
```

---

## Step 6 — `/docs` (P0-6)

```
docs/prd.md            v2
docs/architecture.md   v2
docs/build-plan.md     v2
docs/design.md         v2 (dark)
docs/decisions.md      seed it now
docs/runbook.md        stub; P4-5 and P10-2 fill it
```

Seed `decisions.md`:

```md
# Decisions

## 2026-08-05 — Design system switched to dark

Prototype's dark shell adopted; turmeric replaces marigold for contrast, chili
restricted to expiry countdowns, mint replaces curry green. See design.md v2.
Affects: P0-2, all of Phase 2.

## 2026-08-05 — Prototype features brought into scope

Events, saved, friends, vibe filters, quiz, dish search, distance, directions,
galleries and opening hours are now v1. Owner "modify booking" deliberately NOT
adopted — see prd.md §5.7. Adds ~3 weeks; social layer moved to Phase 9.
Affects: prd.md, architecture.md, build-plan.md.

## 2026-08-05 — Netlify over Vercel

Vercel Hobby is non-commercial only and monetization is deferred, not ruled out.
Affects: P0-4.
```

---

## Step 7 — Deploy before any feature work (P0-4)

The point of doing this now, on an empty homepage, is that a deploy problem in hour two costs
twenty minutes and the same problem in week four costs a day.

### 7.1 Create the site

1. netlify.com → sign up or log in with GitHub.
2. **Add new site → Import an existing project → GitHub**. Authorize Netlify if prompted; you
   can grant access to just this one repo rather than all of them.
3. Pick the `destiny` repo.
4. Branch to deploy: `main`.
5. Build settings should auto-detect. Confirm they read:
   - Base directory: _(empty)_
   - Build command: `npm run build`
   - Publish directory: `.next`

   Netlify's Next.js runtime handles SSR, API routes and middleware — you don't install a
   plugin manually.

6. Don't click deploy yet. Add the environment variables first (next step), or the first
   build fails and you'll spend a minute wondering why.

### 7.2 Environment variables, split by deploy context

**Site configuration → Environment variables → Add a variable.** For each one, choose
_Different value for each deploy context_ rather than a single shared value.

| Variable                               | Production           | Deploy previews + branch deploys |
| -------------------------------------- | -------------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | prod project URL     | **dev** project URL              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod publishable key | **dev** publishable key          |
| `SUPABASE_SECRET_KEY`                  | prod secret key      | **dev** secret key               |
| `CRON_SECRET`                          | one you generate     | a different one                  |
| `NODE_VERSION`                         | `22`                 | `22`                             |

Tick **Contains secret values** on `SUPABASE_SECRET_KEY` and `CRON_SECRET`. That hides them
from the UI after saving and keeps them out of build logs.

**This split is the whole reason to do the context setup rather than one shared value.** Every
PR gets a preview deploy, and preview deploys run whatever is on that branch. If previews
point at prod, someone's half-finished migration branch or seed script runs against your real
restaurant data. Previews point at dev, always.

`RESEND_API_KEY` isn't needed until P4-1 — add it then.

### 7.3 Deploy and confirm previews

Click **Deploy site**. First build takes two to four minutes. You get a
`something-random.netlify.app` URL; rename it under **Site configuration → General → Site
details** if you want something readable.

Deploy Previews are on by default. Confirm under **Site configuration → Build & deploy →
Deploy Previews** that it's set to deploy pull requests against `main`.

### 7.4 Smoke test the whole loop

This is the actual ticket, not the site creation:

```bash
git checkout -b p0-4/deploy-smoke-test
# change one visible string on the homepage
git commit -am "P0-4: deploy smoke test"
git push -u origin p0-4/deploy-smoke-test
gh pr create --fill
```

Then check, in order:

1. Netlify posts a check on the PR with a **Deploy Preview** link
2. Opening that link shows your change
3. The preview is hitting **dev** — confirm in the Supabase dev project under Logs, or just
   render a value that differs between the two projects
4. Merge the PR
5. `main` redeploys on its own and the production URL updates

If step 1 doesn't happen, the GitHub app doesn't have access to the repo — reinstall it from
Netlify's GitHub integration settings rather than debugging the build.

**One gotcha worth knowing now:** anything prefixed `NEXT_PUBLIC_` is baked into the bundle at
build time, not read at runtime. Changing one of those values in Netlify does nothing until
you trigger a fresh deploy. When a key "isn't updating", this is almost always why.

**Done when:** merging to `main` deploys automatically, a PR shows a preview link, and the
preview reads from dev rather than prod.

---

## Step 8 — First migration, then stop

This is P1-1, technically Phase 1, but do it together while everyone's in the room so the
migration workflow is demonstrated once rather than explained three times.

```bash
npx supabase migration new enums_and_users
```

In that one file: all six enum types, the `users` table, `alter table users enable row level
security`, and its policies. RLS in the same migration as the table — always.

```bash
npx supabase db push
npx supabase gen types typescript --linked > types/db.ts
git add -A && git commit -m "P1-1: enums + users + RLS"
```

**Now name your migration owner out loud.** One person, all schema changes through them,
including trivial ones.

---

## Step 9 — What to do next

- **Lane A** — Phase 1 data layer, migration owner. Pull P1-12 (the seed script) forward
  rather than leaving it last; it unblocks everyone else.
- **Lane B and C** — Phase 2 primitives against `/dev/components`.

Then Phase 3 in three parallel slices. At the end of Phase 3 you have a browsable product on
seed data with no auth — show it to a restaurant owner and a few students **before** starting
Phase 5.

Two sequencing notes worth repeating:

**P1-11, the RLS test script, comes before anything reads the social tables.** Those policies
are the only place in this app where a bug exposes one student's data to another. Test with
three accounts — a friend, a non-friend, and a friend with sharing off — and assert all three.

**P6-1, the booking state machine, gets written first and completely, with tests, before any
booking UI exists.** It's the most failure-prone flow in the product, and the tests are what
let you change the reminder window later without re-reasoning about everything.

---

## Checklist

- [ ] Repo created, `main` protected, one-review rule on
- [ ] Folder skeleton committed, ESLint import rule in place
- [ ] Dark tokens in `globals.css`, fonts via `next/font`, no raw hex elsewhere
- [ ] Two Supabase projects created in Mumbai, DB passwords saved
- [ ] `.env.local` populated and confirmed ignored, secret key server-only
- [ ] All nine `/config` files exist with PRD-referencing comments
- [ ] `/docs` populated with all four v2 documents, `decisions.md` seeded
- [ ] Netlify deploy live, preview URLs on PRs, previews pointed at dev not prod
- [ ] First migration pushed, `types/db.ts` committed
- [ ] Migration owner named
