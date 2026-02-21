-- RLS policies for audio cursos tables

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pacotes_leis', 'subpastas_leis', 'leis', 'audio_leis', 'questoes_leis', 'lei_user_access'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- Drop existing policies if any, then recreate
    EXECUTE format('DROP POLICY IF EXISTS "%s_read" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s_read" ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_admin" ON %I FOR ALL USING (is_admin())', t, t);
  END LOOP;
END $$;
