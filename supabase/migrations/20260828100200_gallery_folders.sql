-- Free-text gallery folders so an owner can group photos ("Ambience",
-- "Food & Drinks", ...) instead of one flat gallery.
--
-- Upstream shipped this as two migrations: the first added a six-value CHECK
-- constraint, the second dropped it and relabelled the values. Only the end
-- state matters for a database built from this branch, so it is one step here.
-- Guarded so it is also a no-op on a database that took the upstream pair.
alter table restaurant_photos
  add column if not exists gallery_category text;

-- Deliberately unconstrained: folder names are owner-authored labels, and a
-- CHECK constraint would turn "let me rename this folder" into a migration.
-- Length is bounded in lib/owner/actions.ts where the write happens.
alter table restaurant_photos
  drop constraint if exists restaurant_photos_gallery_category_check;

update restaurant_photos
set gallery_category = case gallery_category
  when 'ambience' then 'Ambience'
  when 'food_drinks' then 'Food & Drinks'
  when 'outdoor_seating' then 'Outdoor Seating'
  when 'interior' then 'Interior'
  when 'exterior' then 'Exterior'
  when 'other' then 'Gallery'
  else coalesce(gallery_category, 'Gallery')
end
where kind = 'gallery';
