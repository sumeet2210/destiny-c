-- Restores the `study` vibe tag on databases that took the abandoned onboarding
-- branch's data rewrite.
--
-- Background. 20260825100000_owner_profile_details.sql (upstream, not part of
-- this branch) shipped a schema change and a silent data rewrite together:
--     update restaurants
--     set vibe_tags = array_replace(vibe_tags, 'study', 'work')
--     where vibe_tags @> array['study']::text[];
--
-- The accompanying code rename was deliberately not adopted here: `study` is one
-- of the eight vibes PRD §5.3 names, docs/decisions.md 2026-08-07 settled it, and
-- config/quiz.ts plus lib/domain/restaurant-match.ts still key off it -- renaming
-- the tag would orphan the quiz's "somewhere to study" answer. config/vibes.ts
-- has no `work` tag at all.
--
-- So on a database that took that migration, the rows say `work` while every
-- reader looks for `study`. Nothing errors: `vibe_tags` is text[], not an enum,
-- so the Study chip and the quiz's study branch simply match zero restaurants.
-- That is the quietest possible failure -- a filter that works, and is wrong.
--
-- A no-op on a database built from this branch, where no row ever held `work`.
update restaurants
set vibe_tags = array_replace(vibe_tags, 'work', 'study')
where vibe_tags @> array['work']::text[];

-- No de-duplication pass: `work` was never a valid tag before the upstream
-- rename and `study` was removed by it, so a row cannot hold both. The owner
-- profile form writes the whole array from config/vibes.ts, which means a later
-- owner edit replaces the array rather than mixing vocabularies.
