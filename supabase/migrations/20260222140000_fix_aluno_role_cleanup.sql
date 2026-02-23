-- Remove a role 'aluno' de usuários que também são admin ou professor
-- Esses usuários receberam 'aluno' automaticamente pelo trigger original
DELETE FROM public.user_roles
WHERE role = 'aluno'
  AND user_id IN (
    SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'professor')
  );
