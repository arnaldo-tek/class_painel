-- Migration: Ajustes Painel Admin 01/03/2026
-- 1. Block rejected professors from creating courses (RLS)
-- 2. Add destinatario field to tutoriais
-- 3. Add estado_id/municipio_id to editais and noticias
-- 4. Add resposta_escrita to questoes_leis

-- 1. RLS policy: Block INSERT on cursos when professor is not approved
-- First check if a policy already exists for professor insert
DO $$
BEGIN
  -- Drop existing professor insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'professor_insert_cursos' AND tablename = 'cursos'
  ) THEN
    DROP POLICY professor_insert_cursos ON cursos;
  END IF;
END $$;

CREATE POLICY professor_insert_cursos ON cursos
  FOR INSERT
  WITH CHECK (
    -- Admin can always insert
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Professor must be approved
    EXISTS (
      SELECT 1 FROM professor_profiles
      WHERE user_id = auth.uid()
      AND approval_status = 'aprovado'
      AND is_blocked = false
    )
  );

-- 2. Add destinatario column to tutoriais
ALTER TABLE tutoriais
  ADD COLUMN IF NOT EXISTS destinatario text DEFAULT 'professor'
  CHECK (destinatario IN ('professor', 'aluno', 'todos'));

-- 3. Add filter columns to editais and noticias
ALTER TABLE editais
  ADD COLUMN IF NOT EXISTS estado_id uuid REFERENCES estados(id),
  ADD COLUMN IF NOT EXISTS municipio_id uuid REFERENCES municipios(id);

ALTER TABLE noticias
  ADD COLUMN IF NOT EXISTS estado_id uuid REFERENCES estados(id),
  ADD COLUMN IF NOT EXISTS municipio_id uuid REFERENCES municipios(id);

-- 4. Add resposta_escrita to questoes_leis
ALTER TABLE questoes_leis
  ADD COLUMN IF NOT EXISTS resposta_escrita text;
