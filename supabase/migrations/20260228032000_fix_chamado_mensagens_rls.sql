-- Fix RLS policies for chamado_mensagens
DROP POLICY IF EXISTS "chamado_mensagens_read" ON chamado_mensagens;
DROP POLICY IF EXISTS "chamado_mensagens_insert" ON chamado_mensagens;

-- SELECT: owner do chamado, autor da mensagem, ou admin
CREATE POLICY "chamado_mensagens_read" ON chamado_mensagens
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chamados WHERE chamados.id = chamado_mensagens.chamado_id AND chamados.user_id = auth.uid()
    )
    OR is_admin()
  );

-- INSERT: qualquer autenticado pode inserir se é dono do chamado ou admin
CREATE POLICY "chamado_mensagens_insert" ON chamado_mensagens
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );
