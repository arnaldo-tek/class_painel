-- Create audiocursos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audiocursos', 'audiocursos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload audiocursos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audiocursos');

-- Allow public read access
CREATE POLICY "Public read access for audiocursos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audiocursos');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete audiocursos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audiocursos');
