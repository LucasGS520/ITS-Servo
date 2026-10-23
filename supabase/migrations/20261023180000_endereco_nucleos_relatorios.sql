-- O endereço da Sede continua em configuracao_relatorios. Cada outro núcleo
-- físico possui endereço próprio; dados ausentes não recebem o da Sede.
ALTER TABLE public.nucleos
  ADD COLUMN IF NOT EXISTS endereco TEXT
  CHECK (endereco IS NULL OR length(trim(endereco)) BETWEEN 5 AND 240);
