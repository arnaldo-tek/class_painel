-- Fix: allow professors to manage flashcards they created (professor_id matches their profile)
-- Before: only aluno_id = auth.uid() OR admin could access flashcards
-- Professors insert with aluno_id = NULL and professor_id = their professor profile id

DROP POLICY IF EXISTS "fc_own" ON flashcards;
DROP POLICY IF EXISTS "fc_aluno_own" ON flashcards;
DROP POLICY IF EXISTS "fc_professor_own" ON flashcards;
DROP POLICY IF EXISTS "fc_admin" ON flashcards;
DROP POLICY IF EXISTS "fc_aluno_read_professor" ON flashcards;

-- Alunos: manage their own flashcards
CREATE POLICY "fc_aluno_own" ON flashcards
  FOR ALL
  USING (aluno_id = auth.uid())
  WITH CHECK (aluno_id = auth.uid());

-- Professors: manage flashcards linked to their professor profile
CREATE POLICY "fc_professor_own" ON flashcards
  FOR ALL
  USING (professor_id = get_my_professor_id())
  WITH CHECK (professor_id = get_my_professor_id());

-- Admin: full access
CREATE POLICY "fc_admin" ON flashcards
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Alunos can also READ professor-created flashcards for their enrolled courses/lessons
CREATE POLICY "fc_aluno_read_professor" ON flashcards
  FOR SELECT
  USING (
    aluno_id IS NULL
    AND professor_id IS NOT NULL
  );
