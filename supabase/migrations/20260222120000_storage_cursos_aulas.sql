-- Create storage buckets for cursos and aulas
INSERT INTO storage.buckets (id, name, public) VALUES ('cursos', 'cursos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('aulas', 'aulas', true) ON CONFLICT DO NOTHING;

-- Drop existing storage policies to recreate with all buckets
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read public files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;

-- Recreate policies including cursos and aulas
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores')
  );

CREATE POLICY "Anyone can read public files" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores')
  );

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores')
  );

CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'cursos', 'aulas', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores')
  );
