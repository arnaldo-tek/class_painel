-- ============================================================
-- SUPERCLASSE - Schema Revision v2
-- Correções, tabelas faltantes e limpezas pós-auditoria
-- ============================================================

-- ===================
-- P0 — Corrigir trigger handle_new_user()
-- Problema: atribuía role 'aluno' a todo novo usuário, incluindo admins criados via API
-- ===================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'photo_url', '')
  );
  -- Só atribui 'aluno' se não veio com role específico no metadata
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno'::public.user_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::public.user_role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- P1 — Funcionalidades core
-- ===================

-- 2. Tabela lesson_progress (progresso do aluno por aula)
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  quiz_total INTEGER,
  quiz_best_score INTEGER,
  last_quiz_at TIMESTAMPTZ,
  audio_position_seconds NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, aula_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_curso ON lesson_progress(curso_id);
CREATE INDEX idx_lesson_progress_user_curso ON lesson_progress(user_id, curso_id);

CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS para lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_own_read" ON lesson_progress FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "lp_own_insert" ON lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "lp_own_update" ON lesson_progress FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "lp_admin" ON lesson_progress FOR ALL
  USING (is_admin());

-- 3. View v_course_progress (percentual de conclusão)
CREATE VIEW v_course_progress AS
SELECT
  e.user_id,
  e.curso_id,
  COUNT(DISTINCT a.id) AS total_lessons,
  COUNT(DISTINCT lp.aula_id) FILTER (WHERE lp.is_completed) AS completed_lessons,
  CASE
    WHEN COUNT(DISTINCT a.id) > 0
    THEN ROUND(
      COUNT(DISTINCT lp.aula_id) FILTER (WHERE lp.is_completed)::numeric
      / COUNT(DISTINCT a.id) * 100, 1
    )
    ELSE 0
  END AS completion_percentage
FROM enrollments e
JOIN aulas a ON a.curso_id = e.curso_id
LEFT JOIN lesson_progress lp ON lp.aula_id = a.id AND lp.user_id = e.user_id
GROUP BY e.user_id, e.curso_id;

-- 4. Indexes de sort_order (ordenação de módulos, aulas, questões)
CREATE INDEX idx_modulos_sort ON modulos(curso_id, sort_order);
CREATE INDEX idx_aulas_sort ON aulas(modulo_id, sort_order);
CREATE INDEX idx_questoes_sort ON questoes_da_aula(aula_id, sort_order);

-- 5. Campos de auditoria em professor_profiles
ALTER TABLE professor_profiles
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN approved_by UUID REFERENCES profiles(id);

-- 6. Trigger updated_at em profiles já existe (linha 547 do schema inicial)
-- cursos e professor_profiles também já existem. Nada a fazer aqui.

-- 7. UNIQUE constraint em chats(user_a, user_b) já existe (linha 262 do schema inicial)
-- Nada a fazer.

-- 8. Adicionar enrolled_at em mentoria_alunos
ALTER TABLE mentoria_alunos
  ADD COLUMN enrolled_at TIMESTAMPTZ DEFAULT now();

-- ===================
-- P2 — Melhorias e limpeza
-- ===================

-- 9. Tabela push_tokens (push notifications)
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(user_id, is_active) WHERE is_active = true;

-- RLS para push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_own_read" ON push_tokens FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "pt_own_insert" ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "pt_own_update" ON push_tokens FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "pt_own_delete" ON push_tokens FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY "pt_admin" ON push_tokens FOR ALL
  USING (is_admin());

-- 10. Tabela favoritos (genérica)
CREATE TABLE favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('curso', 'noticia', 'edital', 'lei')),
  referencia_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tipo, referencia_id)
);

CREATE INDEX idx_favoritos_user ON favoritos(user_id);
CREATE INDEX idx_favoritos_user_tipo ON favoritos(user_id, tipo);

-- RLS para favoritos
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav_own" ON favoritos FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "fav_admin" ON favoritos FOR ALL
  USING (is_admin());

-- 11. Tabela quiz_attempts (histórico de tentativas)
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_aula ON quiz_attempts(aula_id);
CREATE INDEX idx_quiz_attempts_user_aula ON quiz_attempts(user_id, aula_id);

-- RLS para quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_own_read" ON quiz_attempts FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "qa_own_insert" ON quiz_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "qa_admin" ON quiz_attempts FOR ALL
  USING (is_admin());

-- 12. Remover colunas denormalizadas desnecessárias
ALTER TABLE cursos DROP COLUMN IF EXISTS nome_professor;
ALTER TABLE cursos DROP COLUMN IF EXISTS module_count;
ALTER TABLE noticias DROP COLUMN IF EXISTS categoria_nome;
ALTER TABLE editais DROP COLUMN IF EXISTS categoria_nome;
