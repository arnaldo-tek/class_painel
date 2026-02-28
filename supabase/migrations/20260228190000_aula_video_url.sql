-- Add video_url column to aulas table
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN aulas.video_url IS 'URL do video principal da aula (armazenado no Supabase Storage)';
