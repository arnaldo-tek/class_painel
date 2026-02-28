-- ============================================================
-- Tabelas: sugestoes e solicitacoes_reembolso
-- ============================================================

-- Sugestoes dos alunos
CREATE TABLE IF NOT EXISTS sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own suggestions"
  ON sugestoes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own suggestions"
  ON sugestoes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all suggestions"
  ON sugestoes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Solicitacoes de reembolso
CREATE TABLE IF NOT EXISTS solicitacoes_reembolso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movimentacao_id UUID NOT NULL REFERENCES movimentacoes(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  detalhes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE solicitacoes_reembolso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own refund requests"
  ON solicitacoes_reembolso FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own refund requests"
  ON solicitacoes_reembolso FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all refund requests"
  ON solicitacoes_reembolso FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
