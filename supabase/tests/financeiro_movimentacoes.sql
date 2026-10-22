-- Rodar somente em banco descartável com usuário admin de teste.
-- Asserções transacionais; nada permanece após ROLLBACK.
BEGIN;
DO $$
DECLARE
  v_pessoa UUID;
  v_inscricao UUID;
  v_entrada UUID;
  v_devolucao UUID;
  v_historico UUID;
  v_categoria_entrada UUID;
  v_categoria_saida UUID;
  v_categoria_curso UUID;
  v_curso UUID;
BEGIN
  SELECT id INTO v_categoria_entrada FROM public.categorias_financeiras WHERE nome='Mensalidade' AND tipo='entrada';
  SELECT id INTO v_categoria_saida FROM public.categorias_financeiras WHERE nome='Devolução Matrícula/Livros' AND tipo='saida';
  SELECT id INTO v_categoria_curso FROM public.categorias_financeiras WHERE nome='Curso Teológico' AND tipo='entrada';
  SELECT id INTO v_curso FROM public.cursos WHERE codigo='teologico';
  INSERT INTO public.pessoas(nome_completo,cpf) VALUES('Pessoa de teste','12345678901') RETURNING id INTO v_pessoa;
  INSERT INTO public.inscricoes(nome_completo,cpf,telefone,email,data_nascimento,escolaridade,
    modalidade,nucleo,status,destino,pessoa_id,curso_id)
  VALUES('Pessoa de teste','12345678901','11999999999','teste@example.invalid','1990-01-01',
    'Médio','presencial','sede_jd_santa_monica','em_analise','curso',v_pessoa,v_curso)
  RETURNING id INTO v_inscricao;

  v_entrada := public.salvar_movimentacao_its(NULL,'entrada',150,'2026-10-10','2026-10-01',
    v_categoria_entrada,NULL,NULL,NULL,v_inscricao,NULL,'mensalidade','2026-09-01',NULL,'Parcial');
  IF (SELECT count(*) FROM public.recebimentos_its WHERE lancamento_id=v_entrada) <> 1
     OR (SELECT count(*) FROM public.lancamentos_financeiros WHERE id=v_entrada) <> 1 THEN
    RAISE EXCEPTION 'Pagamento duplicado ou espelho ausente';
  END IF;
  IF (SELECT unidade FROM public.lancamentos_financeiros WHERE id=v_entrada) <> 'sede_jd_santa_monica' THEN
    RAISE EXCEPTION 'Unidade da inscricao nao foi herdada';
  END IF;
  PERFORM public.salvar_movimentacao_its(v_entrada,'entrada',130,'2026-10-11','2026-10-01',
    v_categoria_entrada,NULL,NULL,NULL,v_inscricao,NULL,'mensalidade','2026-09-01',NULL,'Corrigido');
  IF (SELECT valor FROM public.recebimentos_its WHERE lancamento_id=v_entrada) <> 130
     OR NOT EXISTS(SELECT 1 FROM public.auditoria_operacional WHERE entidade_id=v_entrada AND acao='editado') THEN
    RAISE EXCEPTION 'Edicao nao sincronizou recibo ou auditoria';
  END IF;
  v_devolucao := public.devolver_movimentacao_its(v_entrada,50,'2026-10-12',v_categoria_saida,NULL);
  IF (SELECT unidade FROM public.lancamentos_financeiros WHERE id=v_devolucao) <> 'sede_jd_santa_monica'
     OR (SELECT sum(CASE WHEN tipo='entrada' THEN valor ELSE -valor END) FROM public.lancamentos_financeiros WHERE id IN (v_entrada,v_devolucao)) <> 80 THEN
    RAISE EXCEPTION 'Devolucao nao preservou nucleo ou caixa';
  END IF;
  PERFORM public.devolver_movimentacao_its(v_entrada,80,'2026-10-13',v_categoria_saida,'Saldo devolvido');
  IF (SELECT status FROM public.recebimentos_its WHERE lancamento_id=v_entrada) <> 'estornado' THEN
    RAISE EXCEPTION 'Devolucao integral nao atualizou espelho';
  END IF;
  BEGIN
    PERFORM public.devolver_movimentacao_its(v_entrada,1,'2026-10-14',v_categoria_saida,NULL);
    RAISE EXCEPTION 'Devolucao acima do saldo foi aceita';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Devolucao acima do saldo foi aceita' THEN RAISE; END IF;
  END;

  INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,
    categoria_id,origem,origem_referencia)
  VALUES('entrada',20,NULL,'2026-02-01','2026-02-01','mes',v_categoria_curso,'legado','teste:linha:1')
  RETURNING id INTO v_historico;
  PERFORM public.salvar_movimentacao_its(v_historico,'entrada',22,NULL,'2026-02-01',
    v_categoria_curso,NULL,v_curso,NULL,NULL,NULL,NULL,NULL,NULL,'Correção histórica');
  IF (SELECT valor FROM public.lancamentos_financeiros WHERE id=v_historico) <> 22
     OR (SELECT origem_referencia FROM public.lancamentos_financeiros WHERE id=v_historico) <> 'teste:linha:1'
     OR (SELECT data FROM public.lancamentos_financeiros WHERE id=v_historico) IS NOT NULL THEN
    RAISE EXCEPTION 'Edicao historica perdeu origem ou precisao';
  END IF;
END $$;
ROLLBACK;
