-- Add soft delete and ban tracking to professor_profiles
ALTER TABLE professor_profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
