-- Student profiles expose an optional phone number in the profile hub.
alter table users add column if not exists phone text;
