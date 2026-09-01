-- Owners paste the canonical Google Maps place/share link shown on their
-- public restaurant profile. Coordinates remain available for distance math.
alter table restaurants
  add column if not exists google_maps_url text;

alter table restaurants
  add constraint restaurants_google_maps_url_length_check
  check (google_maps_url is null or char_length(google_maps_url) <= 2048);
