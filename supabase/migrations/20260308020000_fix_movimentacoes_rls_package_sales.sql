-- Fix: professors can't see package sales because professor_id is NULL in movimentacoes.
-- Allow professors to also see movimentacoes that have splits attributed to them.

DROP POLICY IF EXISTS "mov_read" ON movimentacoes;

CREATE POLICY "mov_read" ON movimentacoes FOR SELECT USING (
  user_id = auth.uid()
  OR professor_id = get_my_professor_id()
  OR is_admin()
  OR id IN (
    SELECT movimentacao_id FROM movimentacao_splits
    WHERE professor_id = get_my_professor_id()
  )
);
