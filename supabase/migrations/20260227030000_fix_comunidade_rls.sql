-- ============================================================
-- Fix: Alunos podem participar de comunidades e enviar mensagens
-- ============================================================

-- Alunos podem inserir sua propria membership
CREATE POLICY "Users can join communities"
  ON comunidade_membros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Alunos podem sair (deletar sua propria membership)
CREATE POLICY "Users can leave communities"
  ON comunidade_membros FOR DELETE
  USING (auth.uid() = user_id);

-- Alunos podem enviar mensagens
CREATE POLICY "Users can send community messages"
  ON comunidade_mensagens FOR INSERT
  WITH CHECK (auth.uid() = user_id);
