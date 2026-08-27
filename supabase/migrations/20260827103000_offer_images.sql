-- Optional artwork uploaded by restaurant owners for an offer.
alter table offers
  add column if not exists image_url text;
