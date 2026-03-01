-- Adiciona coluna destinatario à tabela tutoriais
-- Valores: 'professor', 'aluno', 'todos'
ALTER TABLE tutoriais ADD COLUMN IF NOT EXISTS destinatario text DEFAULT 'professor';

-- Atualiza registros existentes para 'todos' (visíveis para todos)
UPDATE tutoriais SET destinatario = 'todos' WHERE destinatario IS NULL;
