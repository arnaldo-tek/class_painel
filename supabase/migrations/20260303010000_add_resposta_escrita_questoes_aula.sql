-- Add resposta_escrita column to questoes_da_aula (matching questoes_leis)
ALTER TABLE questoes_da_aula
  ADD COLUMN IF NOT EXISTS resposta_escrita text;
