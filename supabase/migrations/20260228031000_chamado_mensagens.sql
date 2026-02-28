-- Tabela de mensagens de chamados (chat entre admin e aluno/professor)
CREATE TABLE chamado_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chamado_mensagens ENABLE ROW LEVEL SECURITY;

-- Aluno/professor pode ver mensagens dos seus próprios chamados
CREATE POLICY "chamado_mensagens_read" ON chamado_mensagens
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chamados WHERE chamados.id = chamado_mensagens.chamado_id AND chamados.user_id = auth.uid()
    )
    OR is_admin()
  );

-- Qualquer autenticado pode inserir mensagem em chamado que é seu ou se for admin
CREATE POLICY "chamado_mensagens_insert" ON chamado_mensagens
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM chamados WHERE chamados.id = chamado_mensagens.chamado_id AND chamados.user_id = auth.uid()
      )
      OR is_admin()
    )
  );

-- Habilitar Realtime para mensagens de chamados
ALTER PUBLICATION supabase_realtime ADD TABLE chamado_mensagens;
