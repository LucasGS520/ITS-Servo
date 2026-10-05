-- ============================================================================
-- FINALIZAÇÃO DA CENTRAL OPERACIONAL
-- Centraliza matrícula, cobrança, pagamento e status em operações atômicas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Consulta pública: preço e atividade vêm da cobrança criada para a matrícula.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.buscar_inscricao(TEXT, TEXT);
CREATE FUNCTION public.buscar_inscricao(p_numero TEXT, p_token TEXT)
RETURNS TABLE (
  numero_inscricao TEXT,
  nome_completo TEXT,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  data_nascimento DATE,
  escolaridade TEXT,
  modalidade TEXT,
  nucleo TEXT,
  status TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMPTZ,
  destino TEXT,
  destino_nome TEXT,
  valor_devido NUMERIC,
  valor_pago NUMERIC,
  saldo_devedor NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    i.numero_inscricao,
    i.nome_completo,
    i.email,
    i.telefone,
    i.cpf,
    i.data_nascimento,
    i.escolaridade,
    i.modalidade,
    i.nucleo,
    i.status,
    i.comprovante_url,
    i.created_at,
    i.destino,
    COALESCE(curso.nome, edicao.nome, cobranca.referente),
    cobranca.valor_devido,
    COALESCE(pagamentos.valor_pago, 0),
    GREATEST(COALESCE(cobranca.valor_devido, 0) - COALESCE(pagamentos.valor_pago, 0), 0)
  FROM public.inscricoes i
  LEFT JOIN public.cursos curso ON curso.id = i.curso_id
  LEFT JOIN public.edicoes_simposio edicao ON edicao.id = i.edicao_simposio_id
  LEFT JOIN LATERAL (
    SELECT c.id, c.referente, c.valor_devido
    FROM public.cobrancas c
    WHERE c.inscricao_id = i.id AND c.status <> 'cancelada'
    ORDER BY c.created_at
    LIMIT 1
  ) cobranca ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(p.valor), 0) AS valor_pago
    FROM public.pagamentos p
    WHERE p.cobranca_id = cobranca.id AND p.status = 'conciliado'
  ) pagamentos ON true
  WHERE i.numero_inscricao = p_numero
    AND i.consulta_token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

REVOKE ALL ON FUNCTION public.buscar_inscricao(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_inscricao(TEXT, TEXT) TO anon, authenticated;

-- Cancelamento pelo titular também encerra a cobrança e o comprovante pendente.
CREATE OR REPLACE FUNCTION public.cancelar_inscricao(p_numero TEXT, p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.inscricoes
  WHERE numero_inscricao = p_numero
    AND consulta_token_hash = encode(digest(p_token, 'sha256'), 'hex')
    AND status = 'aguardando_pagamento'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.inscricoes SET status = 'cancelado' WHERE id = v_id;
  UPDATE public.pagamentos SET status = 'recusado'
  WHERE inscricao_id = v_id AND status = 'pendente';
  UPDATE public.cobrancas SET status = 'cancelada'
  WHERE inscricao_id = v_id AND status = 'aberta';
  PERFORM public.registrar_auditoria('matricula', v_id, 'cancelada_pelo_titular');
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_inscricao(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancelar_inscricao(TEXT, TEXT) TO anon, authenticated;

INSERT INTO public.categorias_financeiras (nome, tipo, ativo)
VALUES ('Simpósio', 'entrada', true)
ON CONFLICT (nome, tipo) DO UPDATE SET ativo = true;

-- ---------------------------------------------------------------------------
-- Entrada do funil: pessoa, matrícula e cobrança são criadas na mesma transação.
-- A Edge Function valida entrada/rate limit e chama esta função com service_role.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.criar_matricula_operacional(
  p_nome_completo TEXT,
  p_cpf TEXT,
  p_telefone TEXT,
  p_email TEXT,
  p_data_nascimento DATE,
  p_escolaridade TEXT,
  p_modalidade TEXT,
  p_nucleo TEXT,
  p_destino TEXT,
  p_curso_codigo TEXT,
  p_edicao_simposio_id UUID,
  p_consulta_token_hash TEXT
)
RETURNS TABLE (inscricao_id UUID, numero_inscricao TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pessoa_id UUID;
  v_curso public.cursos%ROWTYPE;
  v_edicao public.edicoes_simposio%ROWTYPE;
  v_curso_id UUID;
  v_edicao_id UUID;
  v_categoria_id UUID;
  v_referente TEXT;
  v_categoria_nome TEXT;
  v_valor NUMERIC;
  v_inscricao_id UUID;
  v_numero TEXT;
BEGIN
  INSERT INTO public.pessoas (cpf, nome_completo, telefone, email, data_nascimento, escolaridade)
  VALUES (p_cpf, trim(p_nome_completo), p_telefone, trim(p_email), p_data_nascimento, p_escolaridade)
  ON CONFLICT (cpf) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    data_nascimento = EXCLUDED.data_nascimento,
    escolaridade = EXCLUDED.escolaridade
  RETURNING id INTO v_pessoa_id;

  IF p_destino = 'curso' THEN
    SELECT * INTO v_curso
    FROM public.cursos
    WHERE codigo = p_curso_codigo AND ativo AND publico
    FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Este curso não está disponível para matrícula'; END IF;
    IF v_curso.valor IS NULL OR v_curso.valor <= 0 THEN
      RAISE EXCEPTION 'O preço deste curso ainda não foi configurado';
    END IF;
    v_curso_id := v_curso.id;
    v_referente := v_curso.nome;
    v_categoria_nome := CASE v_curso.codigo
      WHEN 'teologico' THEN 'Curso Teológico'
      WHEN 'capacitacao_obreiros' THEN 'Capacitação de Obreiros'
      ELSE v_curso.nome
    END;
    v_valor := v_curso.valor;
  ELSIF p_destino = 'simposio' THEN
    SELECT * INTO v_edicao
    FROM public.edicoes_simposio
    WHERE id = p_edicao_simposio_id AND ativo AND publico
    FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Esta edição de simpósio não está disponível'; END IF;
    IF v_edicao.valor IS NULL OR v_edicao.valor <= 0 THEN
      RAISE EXCEPTION 'O preço desta edição ainda não foi configurado';
    END IF;
    v_edicao_id := v_edicao.id;
    v_referente := v_edicao.nome;
    v_categoria_nome := 'Simpósio';
    v_valor := v_edicao.valor;
  ELSE
    RAISE EXCEPTION 'Destino inválido';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.inscricoes i
    WHERE i.pessoa_id = v_pessoa_id
      AND i.status <> 'cancelado'
      AND (
        (p_destino = 'curso' AND i.curso_id = v_curso_id) OR
        (p_destino = 'simposio' AND i.edicao_simposio_id = v_edicao_id)
      )
  ) THEN
    RAISE EXCEPTION 'Já existe uma matrícula ativa para este CPF e atividade';
  END IF;

  SELECT id INTO v_categoria_id
  FROM public.categorias_financeiras
  WHERE nome = v_categoria_nome AND tipo = 'entrada' AND ativo
  LIMIT 1;
  IF v_categoria_id IS NULL THEN
    RAISE EXCEPTION 'Categoria financeira não configurada para esta atividade';
  END IF;

  INSERT INTO public.inscricoes AS nova (
    nome_completo, cpf, telefone, email, data_nascimento, escolaridade,
    modalidade, nucleo, consulta_token_hash, pessoa_id, curso_id,
    edicao_simposio_id, destino
  ) VALUES (
    trim(p_nome_completo), p_cpf, p_telefone, trim(p_email), p_data_nascimento,
    p_escolaridade, p_modalidade,
    CASE WHEN p_modalidade = 'presencial' THEN p_nucleo ELSE NULL END,
    p_consulta_token_hash, v_pessoa_id, v_curso_id, v_edicao_id, p_destino
  ) RETURNING nova.id, nova.numero_inscricao INTO v_inscricao_id, v_numero;

  INSERT INTO public.cobrancas (
    pessoa_id, inscricao_id, curso_id, edicao_simposio_id, categoria_id,
    referente, valor_devido
  ) VALUES (
    v_pessoa_id, v_inscricao_id, v_curso_id, v_edicao_id, v_categoria_id,
    v_referente, v_valor
  );

  RETURN QUERY SELECT v_inscricao_id, v_numero;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_matricula_operacional(TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_matricula_operacional(TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Comprovante: atualização da matrícula e criação do pagamento são atômicas.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.registrar_comprovante_operacional(
  p_numero TEXT,
  p_token_hash TEXT,
  p_comprovante_path TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inscricao public.inscricoes%ROWTYPE;
  v_cobranca public.cobrancas%ROWTYPE;
  v_pagamento_id UUID;
BEGIN
  SELECT * INTO v_inscricao
  FROM public.inscricoes
  WHERE numero_inscricao = p_numero AND consulta_token_hash = p_token_hash
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Matrícula não encontrada ou código de acesso inválido'; END IF;
  IF v_inscricao.status NOT IN ('aguardando_pagamento', 'pagamento_nao_identificado', 'comprovante_enviado') THEN
    RAISE EXCEPTION 'Não é possível enviar comprovante no status atual';
  END IF;

  SELECT * INTO v_cobranca
  FROM public.cobrancas
  WHERE inscricao_id = v_inscricao.id AND status = 'aberta'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não existe cobrança em aberto para esta matrícula'; END IF;
  IF EXISTS (SELECT 1 FROM public.pagamentos WHERE cobranca_id = v_cobranca.id AND status = 'pendente') THEN
    RAISE EXCEPTION 'Já existe um comprovante aguardando conferência';
  END IF;

  UPDATE public.inscricoes
  SET comprovante_url = p_comprovante_path, status = 'comprovante_enviado'
  WHERE id = v_inscricao.id;

  INSERT INTO public.pagamentos (inscricao_id, cobranca_id, comprovante_url, status)
  VALUES (v_inscricao.id, v_cobranca.id, p_comprovante_path, 'pendente')
  RETURNING id INTO v_pagamento_id;

  RETURN v_pagamento_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_comprovante_operacional(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_comprovante_operacional(TEXT, TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Conciliação é a única confirmação financeira da matrícula.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.conciliar_pagamento(p_pagamento_id UUID, p_valor NUMERIC, p_data DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pagamento public.pagamentos%ROWTYPE;
  v_cobranca public.cobrancas%ROWTYPE;
  v_inscricao_status TEXT;
  v_id UUID;
  v_total NUMERIC;
  v_quitada BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF p_valor IS NULL OR p_valor <= 0 THEN RAISE EXCEPTION 'Informe um valor recebido válido'; END IF;

  SELECT * INTO v_pagamento FROM public.pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  IF v_pagamento.status = 'recusado' THEN RAISE EXCEPTION 'Pagamento recusado não pode ser conciliado'; END IF;
  IF v_pagamento.status = 'conciliado' THEN
    SELECT id INTO v_id FROM public.lancamentos_financeiros WHERE pagamento_id = p_pagamento_id;
    RETURN v_id;
  END IF;

  SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = v_pagamento.cobranca_id FOR UPDATE;
  IF NOT FOUND OR v_cobranca.categoria_id IS NULL THEN
    RAISE EXCEPTION 'Pagamento precisa de uma cobrança com categoria';
  END IF;
  IF v_cobranca.status = 'cancelada' THEN RAISE EXCEPTION 'Cobrança cancelada não pode receber pagamento'; END IF;

  IF v_pagamento.inscricao_id IS NOT NULL THEN
    SELECT status INTO v_inscricao_status FROM public.inscricoes WHERE id = v_pagamento.inscricao_id FOR UPDATE;
    IF v_inscricao_status = 'cancelado' THEN RAISE EXCEPTION 'Matrícula cancelada não pode receber pagamento'; END IF;
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO v_total
  FROM public.pagamentos
  WHERE cobranca_id = v_cobranca.id AND status = 'conciliado';
  IF v_total + p_valor > v_cobranca.valor_devido THEN
    RAISE EXCEPTION 'O valor informado excede o saldo desta cobrança';
  END IF;

  INSERT INTO public.lancamentos_financeiros (
    tipo, valor, data, competencia, unidade, categoria_id, descricao,
    pagamento_id, cobranca_id, curso_id, edicao_simposio_id, origem
  ) VALUES (
    'entrada', p_valor, p_data, date_trunc('month', p_data)::date, NULL,
    v_cobranca.categoria_id, v_cobranca.referente, p_pagamento_id,
    v_cobranca.id, v_cobranca.curso_id, v_cobranca.edicao_simposio_id, 'pagamento'
  ) RETURNING id INTO v_id;

  UPDATE public.pagamentos
  SET valor = p_valor, data_recebimento = p_data, status = 'conciliado',
      conciliado_por = auth.uid(), conciliado_em = now()
  WHERE id = p_pagamento_id;

  v_total := v_total + p_valor;
  v_quitada := v_total >= v_cobranca.valor_devido;
  UPDATE public.cobrancas SET status = CASE WHEN v_quitada THEN 'quitada' ELSE 'aberta' END
  WHERE id = v_cobranca.id;

  IF v_pagamento.inscricao_id IS NOT NULL THEN
    UPDATE public.inscricoes
    SET status = CASE WHEN v_quitada THEN 'confirmada' ELSE 'aguardando_pagamento' END
    WHERE id = v_pagamento.inscricao_id;
  END IF;

  PERFORM public.registrar_auditoria(
    'pagamento', p_pagamento_id, 'conciliado', NULL,
    jsonb_build_object('registro_financeiro_id', v_id, 'valor', p_valor, 'cobranca_quitada', v_quitada)
  );
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_id;
END;
$$;

CREATE FUNCTION public.recusar_pagamento(p_pagamento_id UUID, p_motivo TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pagamento public.pagamentos%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF COALESCE(trim(p_motivo), '') = '' THEN RAISE EXCEPTION 'Informe o motivo da recusa'; END IF;
  SELECT * INTO v_pagamento FROM public.pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  IF v_pagamento.status <> 'pendente' THEN RAISE EXCEPTION 'Somente pagamentos pendentes podem ser recusados'; END IF;

  UPDATE public.pagamentos SET status = 'recusado' WHERE id = p_pagamento_id;
  IF v_pagamento.inscricao_id IS NOT NULL THEN
    UPDATE public.inscricoes SET status = 'pagamento_nao_identificado'
    WHERE id = v_pagamento.inscricao_id AND status <> 'cancelado';
  END IF;
  PERFORM public.registrar_auditoria('pagamento', p_pagamento_id, 'recusado', trim(p_motivo));
END;
$$;

CREATE FUNCTION public.estornar_pagamento(p_pagamento_id UUID, p_motivo TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pagamento public.pagamentos%ROWTYPE;
  v_cobranca public.cobrancas%ROWTYPE;
  v_original public.lancamentos_financeiros%ROWTYPE;
  v_estorno_id UUID;
  v_total NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF COALESCE(trim(p_motivo), '') = '' THEN RAISE EXCEPTION 'Informe o motivo do estorno'; END IF;

  SELECT * INTO v_pagamento FROM public.pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  IF v_pagamento.status <> 'conciliado' THEN RAISE EXCEPTION 'Somente pagamentos conciliados podem ser estornados'; END IF;
  SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = v_pagamento.cobranca_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cobrança do pagamento não encontrada'; END IF;
  SELECT * INTO v_original FROM public.lancamentos_financeiros
  WHERE pagamento_id = p_pagamento_id AND origem = 'pagamento' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento original do pagamento não encontrado'; END IF;
  IF EXISTS (SELECT 1 FROM public.lancamentos_financeiros WHERE estorno_de_id = v_original.id) THEN
    RAISE EXCEPTION 'Este pagamento já possui estorno';
  END IF;

  INSERT INTO public.lancamentos_financeiros (
    tipo, valor, data, competencia, unidade, categoria_id, aluno_id, descricao,
    cobranca_id, curso_id, edicao_simposio_id, estorno_de_id, motivo, origem
  ) VALUES (
    CASE WHEN v_original.tipo = 'entrada' THEN 'saida' ELSE 'entrada' END,
    v_original.valor, CURRENT_DATE, date_trunc('month', CURRENT_DATE)::date,
    v_original.unidade, v_original.categoria_id, v_original.aluno_id,
    concat('Estorno de pagamento — ', COALESCE(v_original.descricao, v_original.id::text)),
    v_original.cobranca_id, v_original.curso_id, v_original.edicao_simposio_id,
    v_original.id, trim(p_motivo), 'estorno'
  ) RETURNING id INTO v_estorno_id;

  UPDATE public.pagamentos
  SET status = 'recusado', conciliado_por = NULL, conciliado_em = NULL
  WHERE id = p_pagamento_id;
  SELECT COALESCE(sum(valor), 0) INTO v_total FROM public.pagamentos
  WHERE cobranca_id = v_cobranca.id AND status = 'conciliado';
  UPDATE public.cobrancas SET status = CASE WHEN v_total >= valor_devido THEN 'quitada' ELSE 'aberta' END
  WHERE id = v_cobranca.id;
  IF v_pagamento.inscricao_id IS NOT NULL THEN
    UPDATE public.inscricoes
    SET status = CASE WHEN v_total >= v_cobranca.valor_devido THEN 'confirmada' ELSE 'pagamento_nao_identificado' END
    WHERE id = v_pagamento.inscricao_id;
  END IF;

  PERFORM public.registrar_auditoria(
    'pagamento', p_pagamento_id, 'estornado', trim(p_motivo),
    jsonb_build_object('lancamento_original_id', v_original.id, 'estorno_id', v_estorno_id)
  );
  PERFORM public.marcar_relatorio_para_revisao(v_original.data);
  IF date_trunc('month', v_original.data) <> date_trunc('month', CURRENT_DATE) THEN
    PERFORM public.marcar_relatorio_para_revisao(CURRENT_DATE);
  END IF;
  RETURN v_estorno_id;
END;
$$;

-- Mudanças manuais ficam limitadas a exceções operacionais; confirmação nunca é manual.
CREATE FUNCTION public.alterar_status_matricula(p_inscricao_id UUID, p_status TEXT, p_motivo TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_atual TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  SELECT status INTO v_atual FROM public.inscricoes WHERE id = p_inscricao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Matrícula não encontrada'; END IF;
  IF p_status = 'confirmada' THEN RAISE EXCEPTION 'A matrícula é confirmada somente pela conciliação do pagamento'; END IF;
  IF v_atual = 'confirmada' THEN RAISE EXCEPTION 'Matrícula confirmada exige correção financeira antes de alterar o status'; END IF;
  IF NOT (
    (v_atual = 'aguardando_pagamento' AND p_status = 'cancelado') OR
    (v_atual = 'comprovante_enviado' AND p_status IN ('pagamento_nao_identificado', 'cancelado')) OR
    (v_atual = 'pagamento_nao_identificado' AND p_status IN ('aguardando_pagamento', 'cancelado'))
  ) THEN
    RAISE EXCEPTION 'Transição de status não permitida';
  END IF;
  IF p_status IN ('cancelado', 'pagamento_nao_identificado') AND COALESCE(trim(p_motivo), '') = '' THEN
    RAISE EXCEPTION 'Informe o motivo da alteração';
  END IF;

  IF p_status = 'cancelado' THEN
    UPDATE public.pagamentos SET status = 'recusado'
    WHERE inscricao_id = p_inscricao_id AND status = 'pendente';
    UPDATE public.cobrancas SET status = 'cancelada'
    WHERE inscricao_id = p_inscricao_id AND status = 'aberta';
  END IF;
  UPDATE public.inscricoes SET status = p_status WHERE id = p_inscricao_id;
  PERFORM public.registrar_auditoria('matricula', p_inscricao_id, 'status_alterado', trim(p_motivo), jsonb_build_object('de', v_atual, 'para', p_status));
END;
$$;

-- Defesa de consistência: aluno acompanha o estado confirmado da matrícula.
CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_unidade TEXT; v_teologico UUID;
BEGIN
  IF OLD.status = 'confirmada' AND NEW.status IS DISTINCT FROM 'confirmada' THEN
    UPDATE public.alunos SET ativo = false WHERE inscricao_id = NEW.id;
  END IF;

  IF NEW.status = 'confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' THEN
    SELECT id INTO v_teologico FROM public.cursos WHERE codigo = 'teologico';
    IF NEW.destino <> 'curso' OR NEW.curso_id IS DISTINCT FROM v_teologico THEN RETURN NEW; END IF;
    v_unidade := CASE WHEN NEW.modalidade = 'correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END;
    IF v_unidade IS NULL OR v_unidade NOT IN ('sede_jd_santa_monica','engenho_novo','jd_conceicao','ariston','correspondencia') THEN
      RAISE WARNING 'criar_aluno_de_inscricao: unidade inválida (%) na matrícula %', COALESCE(v_unidade, 'NULL'), NEW.numero_inscricao;
      RETURN NEW;
    END IF;
    INSERT INTO public.alunos (nome, unidade, inscricao_id, ativo)
    VALUES (NEW.nome_completo, v_unidade, NEW.id, true)
    ON CONFLICT (inscricao_id) DO UPDATE SET nome = EXCLUDED.nome, unidade = EXCLUDED.unidade, ativo = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Cobranças são mantidas por uma operação auditável, não por escrita direta da UI.
CREATE FUNCTION public.salvar_cobranca(
  p_cobranca_id UUID,
  p_pessoa_id UUID,
  p_inscricao_id UUID,
  p_curso_id UUID,
  p_edicao_simposio_id UUID,
  p_categoria_id UUID,
  p_referente TEXT,
  p_valor_devido NUMERIC,
  p_vencimento DATE,
  p_status TEXT DEFAULT 'aberta'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID; v_pago NUMERIC := 0; v_status TEXT; v_inscricao public.inscricoes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF p_pessoa_id IS NULL THEN RAISE EXCEPTION 'Selecione a pessoa responsável'; END IF;
  IF p_categoria_id IS NULL THEN RAISE EXCEPTION 'Selecione uma categoria financeira'; END IF;
  IF COALESCE(trim(p_referente), '') = '' THEN RAISE EXCEPTION 'Informe a referência da cobrança'; END IF;
  IF p_valor_devido IS NULL OR p_valor_devido <= 0 THEN RAISE EXCEPTION 'Informe um valor devido válido'; END IF;
  IF p_status NOT IN ('aberta', 'cancelada') THEN RAISE EXCEPTION 'Status de cobrança inválido'; END IF;

  IF p_inscricao_id IS NOT NULL THEN
    SELECT * INTO v_inscricao FROM public.inscricoes WHERE id = p_inscricao_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Matrícula relacionada não encontrada'; END IF;
    IF v_inscricao.pessoa_id IS DISTINCT FROM p_pessoa_id THEN
      RAISE EXCEPTION 'A matrícula não pertence ao participante selecionado';
    END IF;
    p_curso_id := v_inscricao.curso_id;
    p_edicao_simposio_id := v_inscricao.edicao_simposio_id;
    IF EXISTS (
      SELECT 1 FROM public.cobrancas
      WHERE inscricao_id = p_inscricao_id
        AND status <> 'cancelada'
        AND id IS DISTINCT FROM p_cobranca_id
    ) THEN
      RAISE EXCEPTION 'Esta matrícula já possui uma cobrança ativa';
    END IF;
  END IF;

  IF p_cobranca_id IS NULL THEN
    INSERT INTO public.cobrancas (
      pessoa_id, inscricao_id, curso_id, edicao_simposio_id, categoria_id,
      referente, valor_devido, vencimento, status
    ) VALUES (
      p_pessoa_id, p_inscricao_id, p_curso_id, p_edicao_simposio_id,
      p_categoria_id, trim(p_referente), p_valor_devido, p_vencimento, p_status
    ) RETURNING id INTO v_id;
    PERFORM public.registrar_auditoria('cobranca', v_id, 'criada', NULL, jsonb_build_object('valor_devido', p_valor_devido));
  ELSE
    PERFORM 1 FROM public.cobrancas WHERE id = p_cobranca_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cobrança não encontrada'; END IF;
    SELECT COALESCE(sum(valor), 0) INTO v_pago FROM public.pagamentos
    WHERE cobranca_id = p_cobranca_id AND status = 'conciliado';
    IF p_valor_devido < v_pago THEN RAISE EXCEPTION 'O valor devido não pode ser menor que o total já recebido'; END IF;
    IF p_status = 'cancelada' AND v_pago > 0 THEN RAISE EXCEPTION 'Cobrança com pagamento conciliado não pode ser cancelada'; END IF;
    v_status := CASE WHEN v_pago >= p_valor_devido THEN 'quitada' ELSE p_status END;
    UPDATE public.cobrancas SET
      pessoa_id = p_pessoa_id,
      inscricao_id = p_inscricao_id,
      curso_id = p_curso_id,
      edicao_simposio_id = p_edicao_simposio_id,
      categoria_id = p_categoria_id,
      referente = trim(p_referente),
      valor_devido = p_valor_devido,
      vencimento = p_vencimento,
      status = v_status
    WHERE id = p_cobranca_id
    RETURNING id INTO v_id;
    PERFORM public.registrar_auditoria('cobranca', v_id, 'alterada', NULL, jsonb_build_object('valor_devido', p_valor_devido, 'status', v_status));
  END IF;
  RETURN v_id;
END;
$$;

-- Alterações cadastrais feitas pelo painel entram na trilha de auditoria.
CREATE OR REPLACE FUNCTION public.auditar_cadastro_operacional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.registrar_auditoria(
    TG_ARGV[0], NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'criado' ELSE 'alterado' END,
    NULL,
    jsonb_build_object('antes', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END, 'depois', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auditar_pessoas ON public.pessoas;
CREATE TRIGGER auditar_pessoas AFTER INSERT OR UPDATE ON public.pessoas
FOR EACH ROW EXECUTE FUNCTION public.auditar_cadastro_operacional('pessoa');
DROP TRIGGER IF EXISTS auditar_cursos ON public.cursos;
CREATE TRIGGER auditar_cursos AFTER INSERT OR UPDATE ON public.cursos
FOR EACH ROW EXECUTE FUNCTION public.auditar_cadastro_operacional('curso');
DROP TRIGGER IF EXISTS auditar_edicoes_simposio ON public.edicoes_simposio;
CREATE TRIGGER auditar_edicoes_simposio AFTER INSERT OR UPDATE ON public.edicoes_simposio
FOR EACH ROW EXECUTE FUNCTION public.auditar_cadastro_operacional('edicao_simposio');

-- O cliente administrativo lê inscrições e modifica status somente por RPC.
DROP POLICY IF EXISTS "Admins can update inscricoes" ON public.inscricoes;

REVOKE EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recusar_pagamento(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.estornar_pagamento(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.alterar_status_matricula(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.salvar_cobranca(UUID, UUID, UUID, UUID, UUID, UUID, TEXT, NUMERIC, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recusar_pagamento(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.estornar_pagamento(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_status_matricula(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_cobranca(UUID, UUID, UUID, UUID, UUID, UUID, TEXT, NUMERIC, DATE, TEXT) TO authenticated;
