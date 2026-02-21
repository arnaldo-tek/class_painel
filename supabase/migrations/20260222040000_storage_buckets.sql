-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('editais', 'editais', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('noticias', 'noticias', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pacotes', 'pacotes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audiocursos', 'audiocursos', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload/read/delete files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos'));

CREATE POLICY "Anyone can read public files" ON storage.objects
  FOR SELECT USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos'));

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos'));
