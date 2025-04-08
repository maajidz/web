-- Add profile_picture_url column to user_profiles table
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comment to the column for documentation
COMMENT ON COLUMN public.user_profiles.profile_picture_url IS 'URL to user''s profile picture or avatar image';
