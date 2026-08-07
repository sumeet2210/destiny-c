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

## 2026-08-07 — Vibe config follows PRD's eight-item list

SETUP.md's `config/vibes.ts` placeholder had six vibes; PRD §5.3 lists eight
(adds Comfort food, Celebration). PRD wins. Affects: P0-5, P3-8.

## 2026-08-07 — Queries layer falls back to local seed data

`lib/queries/*` reads from Supabase when `NEXT_PUBLIC_SUPABASE_URL` is set and
from typed in-memory seed data (`lib/data/seed.ts`) when it isn't. This keeps
rule 0.1 intact (components never know the difference), lets the whole public
surface be built and demoed before the Supabase projects exist, and mirrors
P1-12's intent. Writes require a configured Supabase and fail with a clear
message otherwise. Affects: Phase 1, Phase 3.

## 2026-08-07 — `types/db.ts` hand-written until a project is linked

Rule 0.3 says generated. No Supabase project exists yet in this environment, so
`types/db.ts` is hand-written to exactly match `supabase/migrations/`. First
person to link a project must run
`npx supabase gen types typescript --linked > types/db.ts` and diff it.
Affects: P1-13.
