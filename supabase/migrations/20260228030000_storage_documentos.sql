-- Create storage bucket for documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true) ON CONFLICT DO NOTHING;

-- Drop existing storage policies to recreate with documentos bucket
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;

CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores', 'documentos')
  );
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores', 'documentos')
  );
CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores', 'documentos')
  );
CREATE POLICY "storage_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores', 'documentos')
  );
