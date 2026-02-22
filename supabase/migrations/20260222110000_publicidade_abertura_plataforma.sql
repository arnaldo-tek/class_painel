-- Add plataforma column to publicidade_abertura
ALTER TABLE publicidade_abertura ADD COLUMN IF NOT EXISTS plataforma text;

-- Create unique constraint so each platform has at most 1 image
CREATE UNIQUE INDEX IF NOT EXISTS publicidade_abertura_plataforma_unique ON publicidade_abertura (plataforma) WHERE plataforma IS NOT NULL;
