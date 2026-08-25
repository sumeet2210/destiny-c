alter table restaurant_photos
  add column gallery_category text;

alter table restaurant_photos
  add constraint restaurant_photos_gallery_category_check
  check (
    gallery_category is null
    or gallery_category in (
      'ambience',
      'food_drinks',
      'outdoor_seating',
      'interior',
      'exterior',
      'other'
    )
  );

update restaurant_photos
set gallery_category = 'other'
where kind = 'gallery' and gallery_category is null;
