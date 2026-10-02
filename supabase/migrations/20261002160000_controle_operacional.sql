-- ============================================================================
-- CONTROLE OPERACIONAL: pessoas, cursos, simpósios e registro financeiro.
-- Esta migração preserva as inscrições e os lançamentos existentes; ela apenas
-- os liga aos novos conceitos e remove a possibilidade de apagar o histórico.
-- ============================================================================

CREATE TABLE public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  data_nascimento DATE,
  escolaridade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_pessoas_updated_at
  BEFORE UPDATE ON public.pessoas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pessoas" ON public.pessoas
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE CHECK (codigo IN ('teologico', 'capacitacao_obreiros')),
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) CHECK (valor IS NULL OR valor >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  publico BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.cursos (codigo, nome, valor, ativo, publico)
VALUES
  ('teologico', 'Curso Teológico', 190.00, true, true),
  ('capacitacao_obreiros', 'Capacitação de Obreiros', NULL, true, false)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.categorias_financeiras (nome, tipo) VALUES
  ('Curso Teológico', 'entrada'),
  ('Capacitação de Obreiros', 'entrada')
ON CONFLICT (nome, tipo) DO NOTHING;

CREATE TRIGGER update_cursos_updated_at
  BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cursos" ON public.cursos
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anyone reads cursos publicos" ON public.cursos
  FOR SELECT TO anon, authenticated USING (publico AND ativo);

CREATE TABLE public.edicoes_simposio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  inicio DATE,
  fim DATE,
  valor NUMERIC(10,2) CHECK (valor IS NULL OR valor >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  publico BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fim IS NULL OR inicio IS NULL OR fim >= inicio)
);

CREATE TRIGGER update_edicoes_simposio_updated_at
  BEFORE UPDATE ON public.edicoes_simposio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.edicoes_simposio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage edicoes_simposio" ON public.edicoes_simposio
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anyone reads edicoes publicas" ON public.edicoes_simposio
  FOR SELECT TO anon, authenticated USING (publico AND ativo);

ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS pessoa_id UUID REFERENCES public.pessoas(id),
  ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id),
  ADD COLUMN IF NOT EXISTS edicao_simposio_id UUID REFERENCES public.edicoes_simposio(id),
  ADD COLUMN IF NOT EXISTS destino TEXT NOT NULL DEFAULT 'curso'
    CHECK (destino IN ('curso', 'simposio'));

INSERT INTO public.pessoas (cpf, nome_completo, telefone, email, data_nascimento, escolaridade)
SELECT DISTINCT ON (regexp_replace(cpf, '\\D', '', 'g'))
  regexp_replace(cpf, '\\D', '', 'g'), nome_completo, telefone, email, data_nascimento, escolaridade
FROM public.inscricoes
WHERE cpf IS NOT NULL
ORDER BY regexp_replace(cpf, '\\D', '', 'g'), created_at DESC
ON CONFLICT (cpf) DO NOTHING;

UPDATE public.inscricoes i
SET pessoa_id = p.id,
    curso_id = c.id,
    destino = 'curso'
FROM public.pessoas p
CROSS JOIN public.cursos c
WHERE p.cpf = regexp_replace(i.cpf, '\\D', '', 'g')
  AND c.codigo = 'teologico'
  AND i.pessoa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_inscricoes_pessoa ON public.inscricoes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_curso ON public.inscricoes(curso_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_edicao_simposio ON public.inscricoes(edicao_simposio_id);
CREATE UNIQUE INDEX IF NOT EXISTS inscricoes_pessoa_curso_ativa
  ON public.inscricoes(pessoa_id, curso_id)
  WHERE curso_id IS NOT NULL AND status <> 'cancelado';
CREATE UNIQUE INDEX IF NOT EXISTS inscricoes_pessoa_edicao_ativa
  ON public.inscricoes(pessoa_id, edicao_simposio_id)
  WHERE edicao_simposio_id IS NOT NULL AND status <> 'cancelado';

CREATE TABLE public.cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE RESTRICT,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT,
  edicao_simposio_id UUID REFERENCES public.edicoes_simposio(id) ON DELETE RESTRICT,
  categoria_id UUID REFERENCES public.categorias_financeiras(id) ON DELETE RESTRICT,
  referente TEXT NOT NULL,
  valor_devido NUMERIC(10,2) NOT NULL CHECK (valor_devido > 0),
  vencimento DATE,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'quitada', 'cancelada')),
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cobrancas_pessoa ON public.cobrancas(pessoa_id);
CREATE INDEX idx_cobrancas_inscricao ON public.cobrancas(inscricao_id);
CREATE TRIGGER update_cobrancas_updated_at
  BEFORE UPDATE ON public.cobrancas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage cobrancas" ON public.cobrancas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cobranca_id UUID REFERENCES public.cobrancas(id) ON DELETE RESTRICT,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  valor NUMERIC(10,2) CHECK (valor IS NULL OR valor > 0),
  data_recebimento DATE,
  comprovante_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'conciliado', 'recusado')),
  conciliado_por UUID,
  conciliado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cobranca_id IS NOT NULL OR inscricao_id IS NOT NULL)
);
CREATE INDEX idx_pagamentos_cobranca ON public.pagamentos(cobranca_id);
CREATE INDEX idx_pagamentos_inscricao ON public.pagamentos(inscricao_id);
CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pagamentos" ON public.pagamentos
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.lancamentos_financeiros
  ADD COLUMN IF NOT EXISTS pagamento_id UUID UNIQUE REFERENCES public.pagamentos(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS cobranca_id UUID REFERENCES public.cobrancas(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS edicao_simposio_id UUID REFERENCES public.edicoes_simposio(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS estorno_de_id UUID REFERENCES public.lancamentos_financeiros(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'legado'
    CHECK (origem IN ('legado', 'manual', 'pagamento', 'estorno', 'ajuste'));

CREATE INDEX IF NOT EXISTS idx_lancamentos_pagamento ON public.lancamentos_financeiros(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_curso ON public.lancamentos_financeiros(curso_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_edicao ON public.lancamentos_financeiros(edicao_simposio_id);

CREATE TABLE public.auditoria_operacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  acao TEXT NOT NULL,
  motivo TEXT,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  executado_por UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_entidade ON public.auditoria_operacional(entidade, entidade_id, created_at DESC);
ALTER TABLE public.auditoria_operacional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read auditoria" ON public.auditoria_operacional
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE public.relatorios_mensais_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo DATE NOT NULL CHECK (periodo = date_trunc('month', periodo)::date),
  versao INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'emitida' CHECK (status IN ('emitida', 'revisao_pendente')),
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  emitido_por UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (periodo, versao)
);
ALTER TABLE public.relatorios_mensais_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage relatorios mensais" ON public.relatorios_mensais_versoes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_entidade TEXT, p_entidade_id UUID, p_acao TEXT, p_motivo TEXT DEFAULT NULL, p_dados JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.auditoria_operacional (entidade, entidade_id, acao, motivo, dados)
  VALUES (p_entidade, p_entidade_id, p_acao, p_motivo, p_dados);
END;
$$;

CREATE OR REPLACE FUNCTION public.marcar_relatorio_para_revisao(p_data DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_periodo DATE := date_trunc('month', p_data)::date; v_atual public.relatorios_mensais_versoes%ROWTYPE;
BEGIN
  SELECT * INTO v_atual FROM public.relatorios_mensais_versoes
   WHERE periodo = v_periodo ORDER BY versao DESC LIMIT 1;
  IF FOUND AND v_atual.status = 'emitida' THEN
    INSERT INTO public.relatorios_mensais_versoes (periodo, versao, status, dados)
    VALUES (v_periodo, v_atual.versao + 1, 'revisao_pendente', v_atual.dados);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.criar_registro_financeiro(
  p_tipo TEXT, p_valor NUMERIC, p_data DATE, p_categoria_id UUID,
  p_unidade TEXT DEFAULT NULL, p_aluno_id UUID DEFAULT NULL, p_descricao TEXT DEFAULT NULL,
  p_motivo TEXT DEFAULT NULL, p_curso_id UUID DEFAULT NULL, p_edicao_simposio_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  INSERT INTO public.lancamentos_financeiros
    (tipo, valor, data, competencia, unidade, categoria_id, aluno_id, descricao, motivo, curso_id, edicao_simposio_id, origem)
  VALUES
    (p_tipo, p_valor, p_data, date_trunc('month', p_data)::date, p_unidade, p_categoria_id, p_aluno_id, p_descricao, p_motivo, p_curso_id, p_edicao_simposio_id, 'manual')
  RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('registro_financeiro', v_id, 'criado', p_motivo);
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.conciliar_pagamento(p_pagamento_id UUID, p_valor NUMERIC, p_data DATE)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pagamento public.pagamentos%ROWTYPE; v_cobranca public.cobrancas%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  SELECT * INTO v_pagamento FROM public.pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  IF v_pagamento.status = 'conciliado' THEN
    SELECT id INTO v_id FROM public.lancamentos_financeiros WHERE pagamento_id = p_pagamento_id;
    RETURN v_id;
  END IF;
  SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = v_pagamento.cobranca_id;
  IF NOT FOUND OR v_cobranca.categoria_id IS NULL THEN RAISE EXCEPTION 'Pagamento precisa de uma cobrança com categoria'; END IF;
  IF COALESCE((SELECT sum(valor) FROM public.pagamentos WHERE cobranca_id = v_cobranca.id AND status = 'conciliado'), 0) + p_valor > v_cobranca.valor_devido THEN
    RAISE EXCEPTION 'O valor informado excede o saldo desta cobrança';
  END IF;
  INSERT INTO public.lancamentos_financeiros
    (tipo, valor, data, competencia, unidade, categoria_id, descricao, pagamento_id, cobranca_id, curso_id, edicao_simposio_id, origem)
  VALUES
    ('entrada', p_valor, p_data, date_trunc('month', p_data)::date, NULL, v_cobranca.categoria_id, v_cobranca.referente,
     p_pagamento_id, v_cobranca.id, v_cobranca.curso_id, v_cobranca.edicao_simposio_id, 'pagamento')
  RETURNING id INTO v_id;
  UPDATE public.pagamentos SET valor = p_valor, data_recebimento = p_data, status = 'conciliado', conciliado_por = auth.uid(), conciliado_em = now() WHERE id = p_pagamento_id;
  UPDATE public.cobrancas c SET status = CASE WHEN COALESCE((SELECT sum(valor) FROM public.pagamentos WHERE cobranca_id = c.id AND status = 'conciliado'), 0) >= c.valor_devido THEN 'quitada' ELSE 'aberta' END WHERE c.id = v_cobranca.id;
  PERFORM public.registrar_auditoria('pagamento', p_pagamento_id, 'conciliado', NULL, jsonb_build_object('registro_financeiro_id', v_id));
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.corrigir_registro_financeiro(p_registro_id UUID, p_motivo TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_original public.lancamentos_financeiros%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF COALESCE(trim(p_motivo), '') = '' THEN RAISE EXCEPTION 'Informe o motivo da correção'; END IF;
  SELECT * INTO v_original FROM public.lancamentos_financeiros WHERE id = p_registro_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registro financeiro não encontrado'; END IF;
  INSERT INTO public.lancamentos_financeiros
    (tipo, valor, data, competencia, unidade, categoria_id, aluno_id, descricao, estorno_de_id, motivo, origem)
  VALUES
    (CASE WHEN v_original.tipo = 'entrada' THEN 'saida' ELSE 'entrada' END, v_original.valor, CURRENT_DATE,
     date_trunc('month', CURRENT_DATE)::date, v_original.unidade, v_original.categoria_id, v_original.aluno_id,
     concat('Correção de ', v_original.id), v_original.id, p_motivo, 'estorno')
  RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('registro_financeiro', p_registro_id, 'corrigido', p_motivo, jsonb_build_object('estorno_id', v_id));
  PERFORM public.marcar_relatorio_para_revisao(CURRENT_DATE);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.emitir_relatorio_mensal(p_periodo DATE, p_dados JSONB DEFAULT '{}'::jsonb)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_versao INTEGER; v_periodo DATE := date_trunc('month', p_periodo)::date;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  SELECT COALESCE(max(versao), 0) + 1 INTO v_versao FROM public.relatorios_mensais_versoes WHERE periodo = v_periodo;
  INSERT INTO public.relatorios_mensais_versoes (periodo, versao, dados) VALUES (v_periodo, v_versao, p_dados) RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('relatorio_mensal', v_id, 'emitido', NULL, jsonb_build_object('periodo', v_periodo, 'versao', v_versao));
  RETURN v_id;
END;
$$;

-- O registro financeiro é somente leitura para o cliente autenticado. As
-- mutações passam pelas funções acima, que registram a auditoria.
DROP POLICY IF EXISTS "Admins manage lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Admins read registros financeiros" ON public.lancamentos_financeiros
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_unidade TEXT; v_teologico UUID;
BEGIN
  IF NEW.status = 'confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' THEN
    SELECT id INTO v_teologico FROM public.cursos WHERE codigo = 'teologico';
    IF NEW.destino <> 'curso' OR NEW.curso_id IS DISTINCT FROM v_teologico THEN RETURN NEW; END IF;
    v_unidade := CASE WHEN NEW.modalidade = 'correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END;
    IF v_unidade IS NULL OR v_unidade NOT IN ('sede_jd_santa_monica','engenho_novo','jd_conceicao','ariston','correspondencia') THEN
      RAISE WARNING 'criar_aluno_de_inscricao: unidade inválida (%) na inscrição %', COALESCE(v_unidade, 'NULL'), NEW.numero_inscricao;
      RETURN NEW;
    END IF;
    INSERT INTO public.alunos (nome, unidade, inscricao_id) VALUES (NEW.nome_completo, v_unidade, NEW.id) ON CONFLICT (inscricao_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_registro_financeiro(TEXT, NUMERIC, DATE, UUID, TEXT, UUID, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.corrigir_registro_financeiro(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.emitir_relatorio_mensal(DATE, JSONB) TO authenticated;
