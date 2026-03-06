-- Add 'pacote_lei' to the allowed tipos in favoritos table
ALTER TABLE favoritos DROP CONSTRAINT IF EXISTS favoritos_tipo_check;
ALTER TABLE favoritos ADD CONSTRAINT favoritos_tipo_check
  CHECK (tipo IN ('curso', 'noticia', 'edital', 'lei', 'pacote_lei'));
