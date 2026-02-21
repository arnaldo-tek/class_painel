-- ============================================================
-- SUPERCLASSE - Melhoria da estrutura de categorias
-- filtro_* TEXT → BOOLEAN, tipo TEXT → ENUM
-- ============================================================

BEGIN;

-- ===================
-- ENUM para tipo de categoria
-- ===================

CREATE TYPE categoria_tipo AS ENUM ('curso', 'noticia', 'edital', 'pacote');

-- ===================
-- ALTER categorias
-- ===================

-- Converter tipo TEXT → ENUM
ALTER TABLE categorias
  ALTER COLUMN tipo TYPE categoria_tipo USING tipo::categoria_tipo;

-- Converter filtros TEXT → BOOLEAN
ALTER TABLE categorias
  ALTER COLUMN filtro_estado TYPE BOOLEAN USING COALESCE(filtro_estado, 'false')::BOOLEAN,
  ALTER COLUMN filtro_estado SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_cidade TYPE BOOLEAN USING COALESCE(filtro_cidade, 'false')::BOOLEAN,
  ALTER COLUMN filtro_cidade SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_orgao TYPE BOOLEAN USING COALESCE(filtro_orgao, 'false')::BOOLEAN,
  ALTER COLUMN filtro_orgao SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_escolaridade TYPE BOOLEAN USING COALESCE(filtro_escolaridade, 'false')::BOOLEAN,
  ALTER COLUMN filtro_escolaridade SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_nivel TYPE BOOLEAN USING COALESCE(filtro_nivel, 'false')::BOOLEAN,
  ALTER COLUMN filtro_nivel SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_disciplina TYPE BOOLEAN USING COALESCE(filtro_disciplina, 'false')::BOOLEAN,
  ALTER COLUMN filtro_disciplina SET DEFAULT false;

ALTER TABLE categorias
  ALTER COLUMN filtro_cargo TYPE BOOLEAN USING COALESCE(filtro_cargo, 'false')::BOOLEAN,
  ALTER COLUMN filtro_cargo SET DEFAULT false;

-- Adicionar filtros que faltam
ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS filtro_esfera BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS filtro_orgao_editais_noticias BOOLEAN DEFAULT false;

-- ===================
-- ALTER subcategorias
-- ===================

-- Trocar disciplina TEXT por referência à tabela
ALTER TABLE subcategorias
  ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL;

ALTER TABLE subcategorias
  DROP COLUMN IF EXISTS disciplina;

-- Index para busca por tipo
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);

COMMIT;
