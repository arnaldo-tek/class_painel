-- ============================================================
-- Normalizar orgaos, cargos e disciplinas: texto → FK
-- Substitui campos denormalizados (nome_*) por foreign keys
-- ============================================================

BEGIN;

-- ===================
-- ORGAOS
-- ===================
ALTER TABLE orgaos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE orgaos ADD COLUMN IF NOT EXISTS estado_id UUID REFERENCES estados(id) ON DELETE SET NULL;
ALTER TABLE orgaos ADD COLUMN IF NOT EXISTS municipio_id UUID REFERENCES municipios(id) ON DELETE SET NULL;
ALTER TABLE orgaos ADD COLUMN IF NOT EXISTS escolaridade_id UUID REFERENCES escolaridades(id) ON DELETE SET NULL;
ALTER TABLE orgaos ADD COLUMN IF NOT EXISTS esfera_id UUID REFERENCES esferas(id) ON DELETE SET NULL;

ALTER TABLE orgaos DROP COLUMN IF EXISTS nome_categoria;
ALTER TABLE orgaos DROP COLUMN IF EXISTS nome_estado;
ALTER TABLE orgaos DROP COLUMN IF EXISTS nome_cidade;
ALTER TABLE orgaos DROP COLUMN IF EXISTS nome_escolaridade;

-- ===================
-- CARGOS
-- ===================
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS escolaridade_id UUID REFERENCES escolaridades(id) ON DELETE SET NULL;
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS orgao_id UUID REFERENCES orgaos(id) ON DELETE SET NULL;

ALTER TABLE cargos DROP COLUMN IF EXISTS nome_categoria;
ALTER TABLE cargos DROP COLUMN IF EXISTS nome_escolaridade;
ALTER TABLE cargos DROP COLUMN IF EXISTS nome_orgao;
ALTER TABLE cargos DROP COLUMN IF EXISTS nome_disciplina;

-- ===================
-- DISCIPLINAS
-- ===================
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS esfera_id UUID REFERENCES esferas(id) ON DELETE SET NULL;
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS estado_id UUID REFERENCES estados(id) ON DELETE SET NULL;
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS municipio_id UUID REFERENCES municipios(id) ON DELETE SET NULL;
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS orgao_id UUID REFERENCES orgaos(id) ON DELETE SET NULL;
ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL;

ALTER TABLE disciplinas DROP COLUMN IF EXISTS nome_categoria;
ALTER TABLE disciplinas DROP COLUMN IF EXISTS esfera;
ALTER TABLE disciplinas DROP COLUMN IF EXISTS estado;
ALTER TABLE disciplinas DROP COLUMN IF EXISTS cidade;
ALTER TABLE disciplinas DROP COLUMN IF EXISTS orgao;
ALTER TABLE disciplinas DROP COLUMN IF EXISTS nome_cargo;

COMMIT;
