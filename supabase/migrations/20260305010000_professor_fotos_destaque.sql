-- Add fotos_destaque column to professor_profiles (array of image URLs)
ALTER TABLE professor_profiles
ADD COLUMN IF NOT EXISTS fotos_destaque jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN professor_profiles.fotos_destaque IS 'Array of image URLs for professor highlights carousel';
