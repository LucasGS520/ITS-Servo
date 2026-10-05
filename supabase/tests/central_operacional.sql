BEGIN;

DO $$
DECLARE
  v_admin UUID := '10000000-0000-0000-0000-000000000001';
  v_inscricao UUID;
  v_numero TEXT;
  v_pagamento UUID;
  v_cobranca UUID;
  v_status TEXT;
  v_valor NUMERIC;
  v_total INTEGER;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated',
    'authenticated', 'admin-local@teste.invalid', '', now(), '{}'::jsonb,
    '{}'::jsonb, now(), now()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin');
  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);

  SELECT resultado.inscricao_id, resultado.numero_inscricao
  INTO v_inscricao, v_numero
  FROM public.criar_matricula_operacional(
    'Participante Teste', '52998224725', '11999999999',
    'participante@teste.invalid', DATE '1990-01-01', 'medio', 'presencial',
    'sede_jd_santa_monica', 'curso', 'teologico', NULL,
    encode(extensions.digest('token-local', 'sha256'), 'hex')
  ) AS resultado;

  SELECT id, valor_devido INTO v_cobranca, v_valor
  FROM public.cobrancas WHERE inscricao_id = v_inscricao;
  IF v_valor <> 190 THEN
    RAISE EXCEPTION 'Preço da cobrança não veio do curso: %', v_valor;
  END IF;

  BEGIN
    PERFORM public.alterar_status_matricula(v_inscricao, 'confirmada', NULL);
    RAISE EXCEPTION 'Confirmação manual deveria ter sido recusada';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Confirmação manual deveria ter sido recusada' THEN RAISE; END IF;
  END;

  v_pagamento := public.registrar_comprovante_operacional(
    v_numero, encode(extensions.digest('token-local', 'sha256'), 'hex'),
    v_numero || '/primeiro.pdf'
  );
  PERFORM public.conciliar_pagamento(v_pagamento, 100, DATE '2026-10-05');
  SELECT status INTO v_status FROM public.inscricoes WHERE id = v_inscricao;
  IF v_status <> 'aguardando_pagamento' THEN
    RAISE EXCEPTION 'Pagamento parcial confirmou indevidamente a matrícula: %', v_status;
  END IF;

  v_pagamento := public.registrar_comprovante_operacional(
    v_numero, encode(extensions.digest('token-local', 'sha256'), 'hex'),
    v_numero || '/segundo.pdf'
  );
  PERFORM public.conciliar_pagamento(v_pagamento, 90, DATE '2026-10-05');

  SELECT status INTO v_status FROM public.inscricoes WHERE id = v_inscricao;
  IF v_status <> 'confirmada' THEN
    RAISE EXCEPTION 'Quitação não confirmou a matrícula: %', v_status;
  END IF;
  SELECT status INTO v_status FROM public.cobrancas WHERE id = v_cobranca;
  IF v_status <> 'quitada' THEN
    RAISE EXCEPTION 'Quitação não encerrou a cobrança: %', v_status;
  END IF;
  SELECT count(*) INTO v_total FROM public.alunos
  WHERE inscricao_id = v_inscricao AND ativo;
  IF v_total <> 1 THEN
    RAISE EXCEPTION 'Aluno não foi criado/reativado após confirmação';
  END IF;

  BEGIN
    PERFORM public.alterar_status_matricula(v_inscricao, 'cancelado', 'teste');
    RAISE EXCEPTION 'Matrícula confirmada foi alterada sem correção financeira';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Matrícula confirmada foi alterada sem correção financeira' THEN RAISE; END IF;
  END;

  PERFORM public.estornar_pagamento(v_pagamento, 'Crédito devolvido no teste');
  SELECT status INTO v_status FROM public.inscricoes WHERE id = v_inscricao;
  IF v_status <> 'pagamento_nao_identificado' THEN
    RAISE EXCEPTION 'Estorno não devolveu a matrícula para análise: %', v_status;
  END IF;
  SELECT status INTO v_status FROM public.cobrancas WHERE id = v_cobranca;
  IF v_status <> 'aberta' THEN
    RAISE EXCEPTION 'Estorno não reabriu a cobrança: %', v_status;
  END IF;
  SELECT count(*) INTO v_total FROM public.alunos
  WHERE inscricao_id = v_inscricao AND ativo;
  IF v_total <> 0 THEN
    RAISE EXCEPTION 'Aluno permaneceu ativo depois do estorno';
  END IF;

  SELECT count(*) INTO v_total FROM public.auditoria_operacional
  WHERE entidade = 'pagamento' AND acao = 'conciliado';
  IF v_total <> 2 THEN
    RAISE EXCEPTION 'Conciliações não foram auditadas: %', v_total;
  END IF;
  SELECT count(*) INTO v_total FROM public.auditoria_operacional
  WHERE entidade = 'pagamento' AND acao = 'estornado';
  IF v_total <> 1 THEN
    RAISE EXCEPTION 'Estorno não foi auditado';
  END IF;
END;
$$;

ROLLBACK;
