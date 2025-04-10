-- Add signup_sequence column to users table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS signup_sequence JSONB DEFAULT '[]'::jsonb;

-- Add linkedin_id column to users table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS linkedin_id TEXT;

-- Create an index on linkedin_id for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_linkedin_id_idx ON user_profiles(linkedin_id);

-- Add comment to explain the signup_sequence column
COMMENT ON COLUMN user_profiles.signup_sequence IS 'Array of authentication methods used by the user in the order they were used (e.g., ["linkedin", "phone", "truecaller"])';