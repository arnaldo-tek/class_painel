-- Adiciona coluna nivel_id na tabela cursos (FK para niveis)
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS nivel_id uuid REFERENCES niveis(id);

-- Index para consultas de filtro
CREATE INDEX IF NOT EXISTS idx_cursos_nivel_id ON cursos(nivel_id) WHERE nivel_id IS NOT NULL;
