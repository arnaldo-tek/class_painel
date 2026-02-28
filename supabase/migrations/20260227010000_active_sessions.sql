-- ============================================================
-- Sessão única por usuário (single device login)
-- Quando um usuário loga em um novo dispositivo, a sessão
-- anterior é invalidada e o dispositivo antigo recebe
-- notificação via Realtime para fazer logout.
-- ============================================================

CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  invalidated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);

-- RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Usuário só vê sua própria sessão
CREATE POLICY "Users can read own session"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode inserir/atualizar sua própria sessão
CREATE POLICY "Users can upsert own session"
  ON active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- Função para registrar sessão (upsert) — chamada pelo app no login
-- Invalida a sessão anterior e registra a nova
CREATE OR REPLACE FUNCTION public.register_session(
  p_session_token TEXT,
  p_device_info TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_old_session RECORD;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Busca sessão existente
  SELECT * INTO v_old_session
  FROM active_sessions
  WHERE user_id = v_user_id;

  IF v_old_session IS NOT NULL THEN
    -- Invalida a sessão anterior (isso dispara o Realtime update)
    UPDATE active_sessions
    SET invalidated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  -- Upsert: insere nova sessão ou atualiza
  INSERT INTO active_sessions (user_id, session_token, device_info, created_at, invalidated_at)
  VALUES (v_user_id, p_session_token, p_device_info, now(), NULL)
  ON CONFLICT (user_id)
  DO UPDATE SET
    session_token = EXCLUDED.session_token,
    device_info = EXCLUDED.device_info,
    created_at = now(),
    invalidated_at = NULL;

  v_result := json_build_object(
    'success', true,
    'had_previous_session', v_old_session IS NOT NULL
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
