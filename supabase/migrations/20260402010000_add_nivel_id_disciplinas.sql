ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS nivel_id UUID REFERENCES niveis(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_disciplinas_nivel_id ON disciplinas(nivel_id) WHERE nivel_id IS NOT NULL;
