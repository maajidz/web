-- Add profile_picture_url column to user_profiles table
alter table if exists public.user_profiles
  add column if not exists profile_picture_url text;

-- Add comment to the column for documentation
comment on column public.user_profiles.profile_picture_url is 'URL to user''s profile picture or avatar image';