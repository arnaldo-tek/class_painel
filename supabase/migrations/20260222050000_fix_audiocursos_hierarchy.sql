-- ============================================================
-- Fix Audio Cursos hierarchy: subpastas_leis → pacotes_leis
-- subpastas_leis.parent_id was self-referential, but should
-- reference pacotes_leis (the top-level folders with tipo)
-- ============================================================

BEGIN;

-- Add pacote_lei_id FK to subpastas_leis
ALTER TABLE subpastas_leis
  ADD COLUMN IF NOT EXISTS pacote_lei_id UUID REFERENCES pacotes_leis(id) ON DELETE CASCADE;

-- Add imagem to subpastas_leis (FlutterFlow had images on subpastas)
ALTER TABLE subpastas_leis
  ADD COLUMN IF NOT EXISTS imagem TEXT;

COMMIT;
