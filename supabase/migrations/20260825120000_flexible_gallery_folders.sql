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
