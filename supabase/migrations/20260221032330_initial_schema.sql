-- ============================================================
-- SUPERCLASSE - Schema Inicial
-- Migração de 49+ coleções Firestore para PostgreSQL
-- ============================================================

-- ===================
-- ENUMS
-- ===================
CREATE TYPE user_role AS ENUM ('admin', 'professor', 'colaborador', 'aluno');
CREATE TYPE approval_status AS ENUM ('em_analise', 'aprovado', 'reprovado');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- ===================
-- 1. USUÁRIOS E ROLES
-- ===================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  phone_number TEXT,
  cpf TEXT UNIQUE,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  cidade TEXT,
  estado TEXT,
  pagarme_customer_id TEXT,
  pagarme_card_id TEXT,
  pagarme_address_id TEXT,
  pagarme_subscription_id TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  chave_pix TEXT,
  digito_opcional TEXT,
  nome_empresarial TEXT,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

CREATE TABLE professor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  nome_professor TEXT NOT NULL,
  descricao TEXT,
  biografia TEXT,
  curriculo_url TEXT,
  foto_perfil TEXT,
  foto_capa TEXT,
  pagarme_receiver_id TEXT,
  banco TEXT,
  agencia TEXT,
  digito_agencia TEXT,
  conta TEXT,
  digito_conta TEXT,
  cpf_cnpj TEXT,
  chave_pix TEXT,
  rua TEXT,
  bairro TEXT,
  numero_casa_ap TEXT,
  cidade TEXT,
  estado TEXT,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  tiktok TEXT,
  telefone TEXT,
  email TEXT,
  data_nascimento TEXT,
  disciplina TEXT,
  descricao_contratar_mentorias TEXT,
  descricao_mentorias TEXT,
  contem_mentoria TEXT[],
  tres_motivos_contratar TEXT[],
  approval_status approval_status DEFAULT 'em_analise',
  average_rating NUMERIC(3,2) DEFAULT 0,
  imagens_capa TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_following_professors (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, professor_id)
);

-- ===================
-- 2. DADOS DE REFERÊNCIA
-- ===================

CREATE TABLE estados (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL UNIQUE, imagem TEXT);
CREATE TABLE municipios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, estado_id UUID REFERENCES estados(id) ON DELETE SET NULL);
CREATE TABLE orgaos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, nome_cidade TEXT, nome_estado TEXT, nome_escolaridade TEXT, nome_categoria TEXT);
CREATE TABLE cargos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, nome_orgao TEXT, nome_disciplina TEXT, nome_escolaridade TEXT, nome_categoria TEXT);
CREATE TABLE esferas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL);
CREATE TABLE niveis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL);
CREATE TABLE escolaridades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL);
CREATE TABLE disciplinas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, nome_cargo TEXT, nome_categoria TEXT, esfera TEXT, orgao TEXT, estado TEXT, cidade TEXT);

-- ===================
-- 3. CATEGORIAS
-- ===================

CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  filtro_estado TEXT, filtro_cidade TEXT, filtro_orgao TEXT,
  filtro_escolaridade TEXT, filtro_nivel TEXT, filtro_disciplina TEXT, filtro_cargo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
  disciplina TEXT
);

-- ===================
-- 4. CURSOS
-- ===================

CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, descricao TEXT, imagem TEXT,
  preco NUMERIC(10,2) DEFAULT 0,
  video_aula_apresentacao TEXT,
  professor_id UUID NOT NULL REFERENCES professor_profiles(id),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
  cargo TEXT, cidade TEXT, estado TEXT, escolaridade TEXT, orgao TEXT, nome_professor TEXT,
  is_publicado BOOLEAN DEFAULT false,
  is_encerrado BOOLEAN DEFAULT false,
  is_degustacao BOOLEAN DEFAULT false,
  is_pacote BOOLEAN DEFAULT false,
  is_mentoria BOOLEAN DEFAULT false,
  taxa_superclasse NUMERIC(5,2) DEFAULT 25.0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE curso_disciplinas (
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  PRIMARY KEY (curso_id, disciplina_id)
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  is_suspended BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, curso_id)
);

-- ===================
-- 5. MÓDULOS E AULAS
-- ===================

CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL, descricao TEXT,
  imagem_perfil TEXT, imagem_capa TEXT, texto_aula TEXT, pdf TEXT,
  is_liberado BOOLEAN DEFAULT false, is_degustacao BOOLEAN DEFAULT false,
  autor_id UUID REFERENCES professor_profiles(id),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  modulo_id UUID REFERENCES modulos(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE textos_da_aula (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, texto TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE audios_da_aula (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, titulo TEXT, audio_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE questoes_da_aula (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, pergunta TEXT NOT NULL, resposta TEXT NOT NULL, alternativas TEXT[] NOT NULL, video TEXT, sort_order INTEGER DEFAULT 0);

-- ===================
-- 6. PACOTES
-- ===================

CREATE TABLE pacotes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, descricao TEXT, preco NUMERIC(10,2) DEFAULT 0, imagem TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE pacote_cursos (pacote_id UUID NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE, curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE, PRIMARY KEY (pacote_id, curso_id));
CREATE TABLE pacote_categorias (pacote_id UUID NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE, categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE, PRIMARY KEY (pacote_id, categoria_id));
CREATE TABLE pacote_professors (pacote_id UUID NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE, professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE, PRIMARY KEY (pacote_id, professor_id));
CREATE TABLE package_access (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pacote_id UUID NOT NULL REFERENCES pacotes(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, access_expire_date TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(pacote_id, user_id));

-- ===================
-- 7. LEGISLAÇÃO
-- ===================

CREATE TABLE subpastas_leis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, parent_id UUID REFERENCES subpastas_leis(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE leis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, texto TEXT, subpasta_id UUID REFERENCES subpastas_leis(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), deleted_at TIMESTAMPTZ);
CREATE TABLE lei_user_access (lei_id UUID NOT NULL REFERENCES leis(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, PRIMARY KEY (lei_id, user_id));
CREATE TABLE questoes_leis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lei_id UUID NOT NULL REFERENCES leis(id) ON DELETE CASCADE, pergunta TEXT NOT NULL, resposta TEXT NOT NULL, alternativas TEXT[], video TEXT);
CREATE TABLE audio_leis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lei_id UUID NOT NULL REFERENCES leis(id) ON DELETE CASCADE, titulo TEXT, audio_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE pacotes_leis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT, tipo_pacote_lei INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 8. FLASHCARDS
-- ===================

CREATE TABLE pasta_flashcards (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE bloco_flashcards (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, pasta_id UUID NOT NULL REFERENCES pasta_flashcards(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL, resposta TEXT NOT NULL,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professor_profiles(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  aula_id UUID REFERENCES aulas(id) ON DELETE SET NULL,
  pasta_id UUID REFERENCES pasta_flashcards(id) ON DELETE SET NULL,
  bloco_id UUID REFERENCES bloco_flashcards(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 9. CHAT
-- ===================

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message TEXT, last_message_time TIMESTAMPTZ,
  last_message_sent_by UUID REFERENCES profiles(id),
  message_seen BOOLEAN DEFAULT false, image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT, image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- 10. CONTEÚDO
-- ===================

CREATE TABLE noticias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT NOT NULL, descricao TEXT, imagem TEXT, pdf TEXT, categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL, estado TEXT, cidade TEXT, orgao TEXT, cargo TEXT, disciplina TEXT, categoria_nome TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE editais (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT NOT NULL, descricao TEXT, resumo TEXT, imagem TEXT, pdf TEXT, professor_id UUID REFERENCES professor_profiles(id) ON DELETE SET NULL, categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL, estado TEXT, cidade TEXT, orgao TEXT, cargo TEXT, disciplina TEXT, categoria_nome TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE post_professores (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, descricao TEXT, imagem TEXT, video TEXT, professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE banners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), imagem TEXT NOT NULL, redirecionamento TEXT, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE documentos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, pdf TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE documento_professors (documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE, professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE, PRIMARY KEY (documento_id, professor_id));

-- ===================
-- 11. AVALIAÇÕES
-- ===================

CREATE TABLE avaliacoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rating NUMERIC(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5), comentario TEXT, foto_aluno TEXT, user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, professor_id UUID REFERENCES professor_profiles(id) ON DELETE SET NULL, curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL, pacote_id UUID REFERENCES pacotes(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE comentarios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT, foto_usuario TEXT, comentario TEXT NOT NULL, imagens TEXT[], curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE, professor_id UUID REFERENCES professor_profiles(id) ON DELETE SET NULL, user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 12. FINANCEIRO
-- ===================

CREATE TABLE movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagarme_order_id TEXT, valor NUMERIC(10,2) NOT NULL, valor_curso NUMERIC(10,2), taxa_plataforma NUMERIC(10,2),
  nome_cliente TEXT, email_cliente TEXT, contato_cliente TEXT, nome_curso TEXT, data_string TEXT,
  professor_id UUID REFERENCES professor_profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  pacote_id UUID REFERENCES pacotes(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cupons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo TEXT NOT NULL UNIQUE, valor NUMERIC(10,2) NOT NULL, is_active BOOLEAN DEFAULT true, max_uses INTEGER, uses_count INTEGER DEFAULT 0, valid_until TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 13. SUPORTE
-- ===================

CREATE TABLE chamados (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), id_chamado TEXT, descricao TEXT, imagem TEXT, video TEXT, status TEXT DEFAULT 'aberto', is_suporte_aluno BOOLEAN DEFAULT false, is_suporte_professor BOOLEAN DEFAULT false, user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE suporte (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, descricao TEXT, aluno_id UUID REFERENCES profiles(id) ON DELETE SET NULL, professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE tutoriais (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, descricao TEXT, video TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE faq (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, video TEXT, pergunta TEXT, resposta TEXT, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE notificacoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, descricao TEXT, user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 14. MENTORIAS E OPORTUNIDADES
-- ===================

CREATE TABLE mentorias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), professor_id UUID NOT NULL REFERENCES professor_profiles(id) ON DELETE CASCADE, titulo TEXT, descricao TEXT, preco NUMERIC(10,2), contem TEXT[], created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE mentoria_alunos (mentoria_id UUID NOT NULL REFERENCES mentorias(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, PRIMARY KEY (mentoria_id, user_id));
CREATE TABLE oportunidades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), titulo TEXT, descricao TEXT, disciplina TEXT, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 15. PUBLICIDADE
-- ===================

CREATE TABLE publicidade_abertura (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), imagem TEXT, link TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE publicidade_area_aluno (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), imagem TEXT, link TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE publicidade_audio_curso (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), imagem TEXT, link TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- 16. PDF
-- ===================

CREATE TABLE pdfs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT, url TEXT, user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT now());

-- ===================
-- INDEXES
-- ===================

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_admin_permissions_user ON admin_permissions(user_id);
CREATE INDEX idx_professor_profiles_user ON professor_profiles(user_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_curso ON enrollments(curso_id);
CREATE INDEX idx_cursos_professor ON cursos(professor_id);
CREATE INDEX idx_cursos_categoria ON cursos(categoria_id);
CREATE INDEX idx_cursos_publicado ON cursos(is_publicado) WHERE is_publicado = true;
CREATE INDEX idx_aulas_curso ON aulas(curso_id);
CREATE INDEX idx_aulas_modulo ON aulas(modulo_id);
CREATE INDEX idx_modulos_curso ON modulos(curso_id);
CREATE INDEX idx_flashcards_aluno ON flashcards(aluno_id);
CREATE INDEX idx_flashcards_bloco ON flashcards(bloco_id);
CREATE INDEX idx_movimentacoes_professor ON movimentacoes(professor_id);
CREATE INDEX idx_movimentacoes_user ON movimentacoes(user_id);
CREATE INDEX idx_movimentacoes_status ON movimentacoes(status);
CREATE INDEX idx_avaliacoes_curso ON avaliacoes(curso_id);
CREATE INDEX idx_avaliacoes_professor ON avaliacoes(professor_id);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id, created_at DESC);
CREATE INDEX idx_chats_user_a ON chats(user_a);
CREATE INDEX idx_chats_user_b ON chats(user_b);
CREATE INDEX idx_notificacoes_user ON notificacoes(user_id, is_read);
CREATE INDEX idx_noticias_created ON noticias(created_at DESC);
CREATE INDEX idx_editais_created ON editais(created_at DESC);
CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX idx_municipios_estado ON municipios(estado_id);
CREATE INDEX idx_cursos_search ON cursos USING gin(to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, '')));
CREATE INDEX idx_noticias_search ON noticias USING gin(to_tsvector('portuguese', titulo || ' ' || COALESCE(descricao, '')));

-- ===================
-- HELPER FUNCTIONS
-- ===================

CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS user_role[] AS $$
  SELECT array_agg(role) FROM user_roles WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = required_role);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_professor_owner(prof_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM professor_profiles WHERE id = prof_id AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_professor_id()
RETURNS UUID AS $$
  SELECT id FROM professor_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===================
-- ROW LEVEL SECURITY
-- ===================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (is_admin());

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_reads_own_roles" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_manages_roles" ON user_roles FOR ALL USING (is_admin());

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perms_select" ON admin_permissions FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "perms_admin" ON admin_permissions FOR ALL USING (is_admin());

ALTER TABLE professor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prof_read" ON professor_profiles FOR SELECT USING (true);
CREATE POLICY "prof_update_own" ON professor_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "prof_admin" ON professor_profiles FOR ALL USING (is_admin());

ALTER TABLE user_following_professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_own" ON user_following_professors FOR ALL USING (user_id = auth.uid());

ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cursos_read" ON cursos FOR SELECT USING (is_publicado = true OR professor_id = get_my_professor_id() OR is_admin());
CREATE POLICY "cursos_manage" ON cursos FOR ALL USING (professor_id = get_my_professor_id() OR is_admin());

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enroll_read" ON enrollments FOR SELECT USING (user_id = auth.uid() OR curso_id IN (SELECT id FROM cursos WHERE professor_id = get_my_professor_id()) OR is_admin());
CREATE POLICY "enroll_insert" ON enrollments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "enroll_admin" ON enrollments FOR ALL USING (is_admin());

ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modulos_read" ON modulos FOR SELECT USING (true);
CREATE POLICY "modulos_manage" ON modulos FOR ALL USING (curso_id IN (SELECT id FROM cursos WHERE professor_id = get_my_professor_id()) OR is_admin());

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aulas_read" ON aulas FOR SELECT USING (true);
CREATE POLICY "aulas_manage" ON aulas FOR ALL USING (curso_id IN (SELECT id FROM cursos WHERE professor_id = get_my_professor_id()) OR is_admin());

ALTER TABLE textos_da_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "textos_read" ON textos_da_aula FOR SELECT USING (true);
CREATE POLICY "textos_manage" ON textos_da_aula FOR ALL USING (is_admin() OR aula_id IN (SELECT a.id FROM aulas a JOIN cursos c ON a.curso_id = c.id WHERE c.professor_id = get_my_professor_id()));

ALTER TABLE audios_da_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audios_read" ON audios_da_aula FOR SELECT USING (true);
CREATE POLICY "audios_manage" ON audios_da_aula FOR ALL USING (is_admin() OR aula_id IN (SELECT a.id FROM aulas a JOIN cursos c ON a.curso_id = c.id WHERE c.professor_id = get_my_professor_id()));

ALTER TABLE questoes_da_aula ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questoes_read" ON questoes_da_aula FOR SELECT USING (true);
CREATE POLICY "questoes_manage" ON questoes_da_aula FOR ALL USING (is_admin() OR aula_id IN (SELECT a.id FROM aulas a JOIN cursos c ON a.curso_id = c.id WHERE c.professor_id = get_my_professor_id()));

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chats_own" ON chats FOR SELECT USING (user_a = auth.uid() OR user_b = auth.uid() OR is_admin());
CREATE POLICY "chats_create" ON chats FOR INSERT WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_read" ON chat_messages FOR SELECT USING (chat_id IN (SELECT id FROM chats WHERE user_a = auth.uid() OR user_b = auth.uid()) OR is_admin());
CREATE POLICY "msg_insert" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid() AND chat_id IN (SELECT id FROM chats WHERE user_a = auth.uid() OR user_b = auth.uid()));

ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mov_read" ON movimentacoes FOR SELECT USING (user_id = auth.uid() OR professor_id = get_my_professor_id() OR is_admin());
CREATE POLICY "mov_admin" ON movimentacoes FOR ALL USING (is_admin());

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fc_own" ON flashcards FOR ALL USING (aluno_id = auth.uid() OR is_admin());

ALTER TABLE pasta_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pasta_fc_own" ON pasta_flashcards FOR ALL USING (user_id = auth.uid() OR is_admin());

ALTER TABLE bloco_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bloco_fc_own" ON bloco_flashcards FOR ALL USING (pasta_id IN (SELECT id FROM pasta_flashcards WHERE user_id = auth.uid()) OR is_admin());

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON notificacoes FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "notif_update" ON notificacoes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_admin" ON notificacoes FOR ALL USING (is_admin());

-- Tabelas públicas (leitura livre, escrita admin)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'estados','municipios','orgaos','cargos','esferas','niveis','escolaridades','disciplinas',
    'categorias','subcategorias','noticias','banners','tutoriais','faq','pacotes','oportunidades',
    'publicidade_abertura','publicidade_area_aluno','publicidade_audio_curso'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_read" ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_admin" ON %I FOR ALL USING (is_admin())', t, t);
  END LOOP;
END $$;

ALTER TABLE editais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "editais_read" ON editais FOR SELECT USING (true);
CREATE POLICY "editais_manage" ON editais FOR ALL USING (professor_id = get_my_professor_id() OR is_admin());

ALTER TABLE post_professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON post_professores FOR SELECT USING (true);
CREATE POLICY "posts_manage" ON post_professores FOR ALL USING (professor_id = get_my_professor_id() OR is_admin());

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aval_read" ON avaliacoes FOR SELECT USING (true);
CREATE POLICY "aval_insert" ON avaliacoes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "aval_admin" ON avaliacoes FOR ALL USING (is_admin());

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coment_read" ON comentarios FOR SELECT USING (true);
CREATE POLICY "coment_insert" ON comentarios FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "coment_admin" ON comentarios FOR ALL USING (is_admin());

ALTER TABLE package_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pkg_access_own" ON package_access FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "pkg_access_admin" ON package_access FOR ALL USING (is_admin());

ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chamados_own" ON chamados FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "chamados_insert" ON chamados FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chamados_admin" ON chamados FOR ALL USING (is_admin());

ALTER TABLE mentorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentorias_read" ON mentorias FOR SELECT USING (true);
CREATE POLICY "mentorias_manage" ON mentorias FOR ALL USING (professor_id = get_my_professor_id() OR is_admin());

-- ===================
-- REALTIME
-- ===================

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;

-- ===================
-- TRIGGERS
-- ===================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER professor_profiles_updated_at BEFORE UPDATE ON professor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cursos_updated_at BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leis_updated_at BEFORE UPDATE ON leis FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'photo_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'aluno');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update chat on new message
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET last_message = NEW.text, last_message_time = NEW.created_at, last_message_sent_by = NEW.user_id, message_seen = false
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();
