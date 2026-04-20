-- Adiciona campo has_nova_mensagem na tabela chamados
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS has_nova_mensagem boolean NOT NULL DEFAULT false;

-- Trigger: marca has_nova_mensagem = true quando usuário (aluno/professor) envia mensagem
CREATE OR REPLACE FUNCTION fn_chamado_nova_mensagem()
RETURNS TRIGGER AS $$
BEGIN
  -- Só marca como nova mensagem se quem enviou é o dono do chamado (não o admin)
  IF NEW.user_id = (SELECT user_id FROM chamados WHERE id = NEW.chamado_id) THEN
    UPDATE chamados SET has_nova_mensagem = true WHERE id = NEW.chamado_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_chamado_nova_mensagem ON chamado_mensagens;
CREATE TRIGGER trg_chamado_nova_mensagem
  AFTER INSERT ON chamado_mensagens
  FOR EACH ROW EXECUTE FUNCTION fn_chamado_nova_mensagem();
