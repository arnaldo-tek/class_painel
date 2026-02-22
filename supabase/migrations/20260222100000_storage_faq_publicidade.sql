-- Create storage buckets for FAQ and Publicidade
INSERT INTO storage.buckets (id, name, public) VALUES ('faq', 'faq', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('publicidade', 'publicidade', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('professores', 'professores', true) ON CONFLICT DO NOTHING;

-- Drop existing policies and recreate with new buckets
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read public files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores'));

CREATE POLICY "Anyone can read public files" ON storage.objects
  FOR SELECT USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores'));

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais', 'faq', 'publicidade', 'professores'));
