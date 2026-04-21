-- Permite que participantes do chat atualizem message_seen
CREATE POLICY "chats_update" ON chats
  FOR UPDATE
  USING (user_a = auth.uid() OR user_b = auth.uid() OR is_admin());
