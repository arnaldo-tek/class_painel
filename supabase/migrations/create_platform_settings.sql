-- Tabela para configurações da plataforma (markup, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir markup padrão de 30%
INSERT INTO platform_settings (key, value)
VALUES ('markup_percentage', '30')
ON CONFLICT (key) DO NOTHING;

-- RLS: apenas admins podem ler e editar
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform_settings" ON platform_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update platform_settings" ON platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert platform_settings" ON platform_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Professores podem ler o markup para exibir no form
CREATE POLICY "Professors can read markup" ON platform_settings
  FOR SELECT USING (
    key = 'markup_percentage' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'professor')
  );
