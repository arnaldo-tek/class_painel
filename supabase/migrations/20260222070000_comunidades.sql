-- ============================================================
-- Comunidades (fóruns/grupos de alunos)
-- ============================================================

BEGIN;

CREATE TABLE comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  imagem TEXT,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  regras TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comunidade_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspenso BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunidade_id, user_id)
);

CREATE TABLE comunidade_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES comunidades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['comunidades', 'comunidade_membros', 'comunidade_mensagens']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_read" ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_admin" ON %I FOR ALL USING (is_admin())', t, t);
  END LOOP;
END $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('comunidades', 'comunidades', true) ON CONFLICT DO NOTHING;

-- Update storage policies to include comunidades
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read public files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades'));

CREATE POLICY "Anyone can read public files" ON storage.objects
  FOR SELECT USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades'));

CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('editais', 'noticias', 'pacotes', 'audiocursos', 'comunidades'));

COMMIT;
