-- Fix Security Advisor: 10 errors
-- 9x RLS Disabled in Public + 1x Security Definer View

-- ============================================
-- 1. Habilitar RLS nas 9 tabelas
-- ============================================

ALTER TABLE public.pacote_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacote_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacote_professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoria_alunos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Políticas: usuário autenticado pode SELECT
-- ============================================

CREATE POLICY "authenticated_select" ON public.pacote_cursos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.pacote_categorias
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.curso_disciplinas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.pacote_professors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.documentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.documento_professors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.suporte
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.pdfs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select" ON public.mentoria_alunos
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 3. Políticas: admin pode tudo (INSERT/UPDATE/DELETE)
-- ============================================

CREATE POLICY "admin_all" ON public.pacote_cursos
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.pacote_categorias
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.curso_disciplinas
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.pacote_professors
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.documentos
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.documento_professors
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.suporte
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.pdfs
  FOR ALL USING (is_admin());

CREATE POLICY "admin_all" ON public.mentoria_alunos
  FOR ALL USING (is_admin());

-- ============================================
-- 4. Corrigir view v_course_progress: SECURITY INVOKER
-- ============================================

DROP VIEW IF EXISTS public.v_course_progress;

CREATE VIEW public.v_course_progress
WITH (security_invoker = true)
AS
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
