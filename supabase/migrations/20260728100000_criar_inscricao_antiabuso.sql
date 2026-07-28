-- ============================================================================
-- Anti-abuso do funil público de inscrição (endurecimento pré-produção).
--
-- Registro de tentativas por IP para rate limiting na edge criar-inscricao
-- (janela deslizante; a função conta e insere via service_role).
--
-- O guard de CPF duplicado fica NA EDGE (SELECT antes do insert) — um índice
-- único aqui poderia falhar o db push se produção já tiver duplicatas.
--
-- Sem policies: RLS ligada sem policy = acesso só via service_role.
-- ============================================================================

CREATE TABLE public.criar_inscricao_hits (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip         TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hits_ip_created ON public.criar_inscricao_hits (ip, created_at);

ALTER TABLE public.criar_inscricao_hits ENABLE ROW LEVEL SECURITY;

-- O guard de CPF duplicado (busca por cpf ativo) usa o índice idx_inscricoes_cpf
-- já criado em 20260628000001_inscricoes_indexes.sql — nada a criar aqui.
