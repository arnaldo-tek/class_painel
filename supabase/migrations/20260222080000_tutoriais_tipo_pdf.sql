-- Adiciona tipo_tutorial e campo pdf à tabela tutoriais
ALTER TABLE tutoriais ADD COLUMN IF NOT EXISTS tipo_tutorial TEXT DEFAULT 'Video';
ALTER TABLE tutoriais ADD COLUMN IF NOT EXISTS pdf TEXT;

-- Storage bucket para tutoriais
INSERT INTO storage.buckets (id, name, public) VALUES ('tutoriais', 'tutoriais', true) ON CONFLICT DO NOTHING;

-- Atualiza policies de storage para incluir tutoriais
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read public files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais'));

CREATE POLICY "Anyone can read public files" ON storage.objects
  FOR SELECT USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais'));

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades', 'tutoriais'));
