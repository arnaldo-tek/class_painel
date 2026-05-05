-- Adiciona data de encerramento aos cursos
-- Quando definida: curso some da vitrine automaticamente ao chegar a data,
-- mas alunos matriculados mantêm acesso até o último dia.
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS data_encerramento DATE;

-- Atualiza RLS para permitir que alunos matriculados vejam cursos encerrados
-- dentro da janela de acesso (até data_encerramento inclusive)
DROP POLICY IF EXISTS "cursos_read" ON cursos;
CREATE POLICY "cursos_read" ON cursos FOR SELECT USING (
  is_publicado = true
  OR professor_id = get_my_professor_id()
  OR is_admin()
  OR (
    data_encerramento IS NOT NULL
    AND data_encerramento >= CURRENT_DATE
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.curso_id = cursos.id
        AND enrollments.user_id = auth.uid()
        AND (enrollments.is_suspended IS NULL OR enrollments.is_suspended = false)
    )
  )
);
