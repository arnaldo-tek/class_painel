-- ============================================================
-- SUPERCLASSE - Seed Data
-- Dados iniciais para desenvolvimento local
-- ============================================================

-- 1. Criar usuário admin no auth.users
-- Nota: raw_user_meta_data inclui role='admin' para que o trigger handle_new_user()
-- crie o profile e atribua a role correta automaticamente.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  email_change_confirm_status,
  phone_change,
  phone_change_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'adm@superclasse.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Administrador", "role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Identidade do usuário (necessário para login por email)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'adm@superclasse.com',
  'email',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "adm@superclasse.com"}',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- 2. Profile e role do admin são criados automaticamente pelo trigger handle_new_user()
-- Apenas garantimos que as permissões extras existam:

-- 4. Todas as permissões admin
INSERT INTO admin_permissions (user_id, permission) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_cursos'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_professores'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_alunos'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_colaboradores'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_categorias'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_pacotes'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_noticias'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_editais'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_banners'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_cupons'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_financeiro'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_suporte'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_configuracoes'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_legislacao'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_documentos'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_tutoriais'),
  ('a0000000-0000-0000-0000-000000000001', 'gerenciar_audiocursos')
ON CONFLICT (user_id, permission) DO NOTHING;
