-- Permitir que usuarios autenticados leiam profiles basicos de pessoas com quem tem chat
CREATE POLICY "profiles_read_chat_participants" ON profiles
  FOR SELECT
  USING (
    id IN (
      SELECT user_a FROM chats WHERE user_b = auth.uid()
      UNION
      SELECT user_b FROM chats WHERE user_a = auth.uid()
    )
  );
