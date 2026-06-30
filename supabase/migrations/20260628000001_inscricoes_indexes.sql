CREATE INDEX IF NOT EXISTS idx_inscricoes_numero
  ON public.inscricoes (numero_inscricao);

CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf
  ON public.inscricoes (cpf);

CREATE INDEX IF NOT EXISTS idx_inscricoes_email
  ON public.inscricoes (email);

CREATE INDEX IF NOT EXISTS idx_inscricoes_status
  ON public.inscricoes (status);

CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at
  ON public.inscricoes (created_at DESC);
