-- Tabela de splits: rastreia quanto cada professor ganha por venda
CREATE TABLE movimentacao_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id UUID NOT NULL REFERENCES movimentacoes(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  valor_bruto NUMERIC(10,2) NOT NULL,       -- parte proporcional do valor total
  valor_professor NUMERIC(10,2) NOT NULL,    -- 75% do valor_bruto
  valor_plataforma NUMERIC(10,2) NOT NULL,   -- 25% do valor_bruto
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mov_splits_mov ON movimentacao_splits(movimentacao_id);
CREATE INDEX idx_mov_splits_prof ON movimentacao_splits(professor_id);

ALTER TABLE movimentacao_splits ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler splits (filtro por professor é feito no app)
CREATE POLICY "splits_read" ON movimentacao_splits FOR SELECT USING (true);

-- Apenas admin pode inserir/atualizar/deletar
CREATE POLICY "splits_admin" ON movimentacao_splits FOR ALL USING (is_admin());
