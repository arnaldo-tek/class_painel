-- Add filter columns to pacotes table (same string pattern as noticias/editais)
ALTER TABLE pacotes ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE pacotes ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE pacotes ADD COLUMN IF NOT EXISTS orgao text;
ALTER TABLE pacotes ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE pacotes ADD COLUMN IF NOT EXISTS disciplina text;
