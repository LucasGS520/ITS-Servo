-- ============================================================================
-- MÓDULO FINANCEIRO — schema (Fase 1)
--
-- Substitui a planilha anual do ITS (entradas/saídas por unidade × mês).
-- "Unidade" = os 4 núcleos (slugs de packages/supabase/src/nucleos.ts) +
-- 'correspondencia' (modalidade tratada como unidade de relatório).
-- unidade NULL em lançamento = movimento geral/institucional (aba GERAL).
--
-- Acesso: admin-only via public.is_admin() (padrão do projeto).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Alunos — vinculados à inscrição confirmada OU cadastrados à mão (legados)
-- ----------------------------------------------------------------------------
CREATE TABLE public.alunos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  unidade      TEXT NOT NULL CHECK (unidade IN (
                 'sede_jd_santa_monica','engenho_novo','jd_conceicao','ariston','correspondencia'
               )),
  inscricao_id UUID UNIQUE REFERENCES public.inscricoes(id) ON DELETE SET NULL,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  observacoes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alunos_unidade ON public.alunos (unidade) WHERE ativo;

-- ----------------------------------------------------------------------------
-- 2) Categorias financeiras — gerenciáveis no painel; pré-carga no seed.
--    UNIQUE (nome, tipo): "Simpósio" existe como entrada E saída.
--    Exclusão de categoria em uso é bloqueada pelo FK; a UI desativa (ativo).
-- ----------------------------------------------------------------------------
CREATE TABLE public.categorias_financeiras (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  ativo      BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nome, tipo)
);

-- ----------------------------------------------------------------------------
-- 3) Lançamentos — o livro-caixa.
--    data        = dia real do movimento (coluna DATA do relatório impresso)
--    competencia = mês de referência (sempre dia 1) — uma mensalidade de junho
--                  paga em julho entra no relatório de junho.
--    valor sempre positivo; o sentido vem de `tipo`.
-- ----------------------------------------------------------------------------
CREATE TABLE public.lancamentos_financeiros (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  valor        NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data         DATE NOT NULL DEFAULT CURRENT_DATE,
  competencia  DATE NOT NULL CHECK (competencia = date_trunc('month', competencia)::date),
  unidade      TEXT CHECK (unidade IS NULL OR unidade IN (
                 'sede_jd_santa_monica','engenho_novo','jd_conceicao','ariston','correspondencia'
               )),
  categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
  aluno_id     UUID REFERENCES public.alunos(id) ON DELETE RESTRICT,
  descricao    TEXT,
  created_by   UUID DEFAULT auth.uid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lanc_competencia  ON public.lancamentos_financeiros (competencia);
CREATE INDEX idx_lanc_unidade_comp ON public.lancamentos_financeiros (unidade, competencia);
CREATE INDEX idx_lanc_aluno        ON public.lancamentos_financeiros (aluno_id);
CREATE INDEX idx_lanc_categoria    ON public.lancamentos_financeiros (categoria_id);

-- ----------------------------------------------------------------------------
-- 4) RLS — admin-only em tudo (mesmo padrão de inscricoes)
-- ----------------------------------------------------------------------------
ALTER TABLE public.alunos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_financeiras  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alunos" ON public.alunos
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage categorias" ON public.categorias_financeiras
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage lancamentos" ON public.lancamentos_financeiros
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5) updated_at (função update_updated_at_column já existe desde a 1ª migration)
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON public.categorias_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_financeiros_updated_at
  BEFORE UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6) Automação inscrição confirmada → aluno.
--    Vive no banco para valer em QUALQUER caminho de confirmação (painel hoje,
--    edge function amanhã). Idempotente via ON CONFLICT (inscricao_id).
--    Se a inscrição presencial não tiver núcleo válido, o CHECK de `unidade`
--    falha a transação — dado inconsistente não vira aluno silenciosamente.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' THEN
    INSERT INTO public.alunos (nome, unidade, inscricao_id)
    VALUES (
      NEW.nome_completo,
      CASE WHEN NEW.modalidade = 'correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END,
      NEW.id
    )
    ON CONFLICT (inscricao_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inscricao_confirmada
  AFTER UPDATE OF status ON public.inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.criar_aluno_de_inscricao();
