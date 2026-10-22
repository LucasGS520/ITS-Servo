-- O livro-caixa passa a guardar os vínculos operacionais de cada movimento.
-- Recebimentos anteriores continuam como espelho de compatibilidade.
ALTER TABLE public.lancamentos_financeiros
  ADD COLUMN IF NOT EXISTS inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS mes_referencia DATE,
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT,
  ADD COLUMN IF NOT EXISTS finalidade TEXT;

ALTER TABLE public.lancamentos_financeiros
  ADD CONSTRAINT lancamentos_mes_referencia_its_check
    CHECK (mes_referencia IS NULL OR mes_referencia = date_trunc('month', mes_referencia)::date),
  ADD CONSTRAINT lancamentos_finalidade_its_check
    CHECK (finalidade IS NULL OR finalidade IN ('matricula','mensalidade','inscricao_evento','outro'));

CREATE INDEX IF NOT EXISTS lancamentos_inscricao_its_idx ON public.lancamentos_financeiros(inscricao_id);
CREATE INDEX IF NOT EXISTS lancamentos_mes_referencia_its_idx ON public.lancamentos_financeiros(mes_referencia);

UPDATE public.lancamentos_financeiros l SET
  inscricao_id = r.inscricao_id,
  comprovante_url = r.comprovante_url,
  finalidade = r.tipo
FROM public.recebimentos_its r
WHERE r.lancamento_id = l.id;

UPDATE public.lancamentos_financeiros l SET mes_referencia = a.competencia
FROM public.recebimentos_its r
JOIN (
  SELECT recebimento_id, min(competencia) AS competencia
  FROM public.atribuicoes_mensalidade
  GROUP BY recebimento_id
  HAVING count(DISTINCT competencia) = 1
) a ON a.recebimento_id = r.id
WHERE r.lancamento_id = l.id;

-- Upload administrativo no mesmo bucket privado usado pelo site.
CREATE POLICY "Admins upload comprovantes financeiros" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes' AND public.is_admin());

CREATE OR REPLACE FUNCTION public.salvar_movimentacao_its(
  p_id UUID, p_tipo TEXT, p_valor NUMERIC, p_data DATE, p_mes_caixa DATE,
  p_categoria_id UUID, p_unidade TEXT, p_curso_id UUID, p_edicao_simposio_id UUID,
  p_inscricao_id UUID, p_aluno_historico_id UUID, p_finalidade TEXT,
  p_mes_referencia DATE, p_comprovante_url TEXT, p_descricao TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_original public.lancamentos_financeiros%ROWTYPE;
  v_registro public.lancamentos_financeiros%ROWTYPE;
  v_inscricao public.inscricoes%ROWTYPE;
  v_aluno public.alunos%ROWTYPE;
  v_recebimento public.recebimentos_its%ROWTYPE;
  v_categoria public.categorias_financeiras%ROWTYPE;
  v_pessoa_id UUID;
  v_aluno_id UUID;
  v_nucleo_id UUID;
  v_curso_id UUID := p_curso_id;
  v_edicao_id UUID := p_edicao_simposio_id;
  v_unidade TEXT := p_unidade;
  v_mes DATE := coalesce(date_trunc('month',p_data)::date,p_mes_caixa);
  v_precisao TEXT := CASE WHEN p_data IS NULL THEN 'mes' ELSE 'dia' END;
  v_eh_pagamento BOOLEAN := p_inscricao_id IS NOT NULL OR p_aluno_historico_id IS NOT NULL;
  v_devolvido NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_tipo NOT IN ('entrada','saida') OR p_valor IS NULL OR p_valor <= 0 OR p_mes_caixa IS NULL
     OR p_mes_caixa <> date_trunc('month',p_mes_caixa)::date OR v_mes <> p_mes_caixa
  THEN RAISE EXCEPTION 'Tipo, valor ou periodo de caixa invalido'; END IF;
  IF p_inscricao_id IS NOT NULL AND p_aluno_historico_id IS NOT NULL THEN
    RAISE EXCEPTION 'Selecione inscricao ou aluno historico';
  END IF;
  IF p_curso_id IS NOT NULL AND p_edicao_simposio_id IS NOT NULL THEN
    RAISE EXCEPTION 'Selecione somente uma atividade';
  END IF;
  SELECT * INTO v_categoria FROM public.categorias_financeiras WHERE id=p_categoria_id;
  IF NOT FOUND OR v_categoria.tipo <> p_tipo THEN RAISE EXCEPTION 'Categoria incompatível com o movimento'; END IF;
  IF p_id IS NULL AND NOT v_categoria.ativo THEN RAISE EXCEPTION 'Categoria inativa'; END IF;

  IF p_id IS NOT NULL THEN
    SELECT * INTO v_original FROM public.lancamentos_financeiros WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Movimento nao encontrado'; END IF;
    IF v_original.estorno_de_id IS NOT NULL THEN
      IF p_tipo <> 'saida' THEN RAISE EXCEPTION 'Devolucao deve ser uma saida'; END IF;
      IF p_data IS NULL THEN RAISE EXCEPTION 'Informe a data real da devolucao'; END IF;
      SELECT valor INTO v_devolvido FROM public.lancamentos_financeiros
       WHERE id=v_original.estorno_de_id AND tipo='entrada' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Entrada original nao encontrada'; END IF;
      IF p_valor + (SELECT coalesce(sum(valor),0) FROM public.lancamentos_financeiros
                      WHERE estorno_de_id=v_original.estorno_de_id AND id<>p_id) > v_devolvido THEN
        RAISE EXCEPTION 'Devolucao excede a entrada original';
      END IF;
      UPDATE public.lancamentos_financeiros SET
        valor=p_valor,data=p_data,competencia=p_mes_caixa,mes_caixa=p_mes_caixa,
        precisao_data=v_precisao,categoria_id=p_categoria_id,descricao=nullif(trim(p_descricao),'')
       WHERE id=p_id RETURNING * INTO v_registro;
      SELECT id INTO v_recebimento.id FROM public.recebimentos_its
       WHERE lancamento_id=v_original.estorno_de_id;
      IF v_recebimento.id IS NOT NULL THEN
        UPDATE public.recebimentos_its SET status=CASE
          WHEN (SELECT coalesce(sum(valor),0) FROM public.lancamentos_financeiros
                 WHERE estorno_de_id=v_original.estorno_de_id)=v_devolvido THEN 'estornado' ELSE 'confirmado' END
         WHERE id=v_recebimento.id;
      END IF;
      PERFORM public.registrar_auditoria('registro_financeiro',p_id,'editado',NULL,
        jsonb_build_object('antes',to_jsonb(v_original),'depois',to_jsonb(v_registro)));
      PERFORM public.marcar_relatorio_para_revisao(v_original.mes_caixa);
      PERFORM public.marcar_relatorio_para_revisao(p_mes_caixa);
      RETURN p_id;
    END IF;
    SELECT * INTO v_recebimento FROM public.recebimentos_its WHERE lancamento_id=p_id FOR UPDATE;
  ELSIF p_data IS NULL THEN
    RAISE EXCEPTION 'Informe a data real do novo movimento';
  END IF;
  IF p_data IS NULL AND (p_id IS NULL OR v_original.precisao_data <> 'mes') THEN
    RAISE EXCEPTION 'Somente historico com dia desconhecido pode manter data sem dia';
  END IF;
  IF v_original.id IS NOT NULL AND v_original.origem_referencia IS NOT NULL
     AND p_data IS NULL AND p_mes_caixa <> v_original.mes_caixa THEN
    RAISE EXCEPTION 'Informe a data exata para mudar o mes de uma linha historica';
  END IF;

  IF v_eh_pagamento THEN
    IF p_tipo <> 'entrada' THEN RAISE EXCEPTION 'Pagamento deve ser entrada'; END IF;
    IF p_finalidade NOT IN ('matricula','mensalidade','inscricao_evento','outro') THEN
      RAISE EXCEPTION 'Informe a finalidade do pagamento';
    END IF;
    IF p_inscricao_id IS NOT NULL THEN
      SELECT * INTO v_inscricao FROM public.inscricoes WHERE id=p_inscricao_id;
      IF NOT FOUND OR (v_inscricao.status='cancelado' AND (p_id IS NULL OR v_original.inscricao_id IS DISTINCT FROM p_inscricao_id)) THEN
        RAISE EXCEPTION 'Inscricao indisponivel';
      END IF;
      v_pessoa_id := v_inscricao.pessoa_id;
      v_curso_id := v_inscricao.curso_id;
      v_edicao_id := v_inscricao.edicao_simposio_id;
      v_nucleo_id := v_inscricao.nucleo_id;
      v_unidade := CASE WHEN v_inscricao.modalidade='correspondencia' THEN 'correspondencia' ELSE v_inscricao.nucleo END;
      SELECT id INTO v_aluno_id FROM public.alunos WHERE inscricao_id=p_inscricao_id;
      IF (v_inscricao.destino='simposio' AND p_finalidade <> 'inscricao_evento') OR
         (v_inscricao.destino='curso' AND p_finalidade='inscricao_evento') THEN
        RAISE EXCEPTION 'Finalidade incompatível com a atividade';
      END IF;
    ELSE
      SELECT * INTO v_aluno FROM public.alunos
       WHERE id=p_aluno_historico_id AND origem_referencia IS NOT NULL
         AND (situacao <> 'pendente_validacao' OR (p_id IS NOT NULL AND v_original.aluno_id=p_aluno_historico_id));
      IF NOT FOUND THEN RAISE EXCEPTION 'Aluno historico precisa estar validado'; END IF;
      v_pessoa_id := v_aluno.pessoa_id;
      v_aluno_id := v_aluno.id;
      v_curso_id := v_aluno.curso_id;
      v_edicao_id := NULL;
      v_nucleo_id := v_aluno.nucleo_id;
      v_unidade := v_aluno.unidade;
      IF p_finalidade='inscricao_evento' THEN RAISE EXCEPTION 'Aluno historico exige pagamento de curso'; END IF;
    END IF;
  ELSIF v_recebimento.id IS NOT NULL THEN
    RAISE EXCEPTION 'Pagamento existente nao pode perder seu vinculo';
  ELSIF p_finalidade IS NOT NULL OR p_mes_referencia IS NOT NULL THEN
    RAISE EXCEPTION 'Finalidade e mes de referencia exigem um pagador';
  END IF;
  IF p_finalidade='mensalidade' THEN
    IF p_mes_referencia IS NULL AND (p_id IS NULL OR v_original.mes_referencia IS NOT NULL) THEN
      RAISE EXCEPTION 'Informe um mes de referencia para a mensalidade';
    END IF;
    IF p_mes_referencia IS NOT NULL AND p_mes_referencia <> date_trunc('month',p_mes_referencia)::date THEN
      RAISE EXCEPTION 'Mes de referencia invalido';
    END IF;
  ELSIF p_mes_referencia IS NOT NULL THEN
    RAISE EXCEPTION 'Mes de referencia so se aplica a mensalidade';
  END IF;
  IF v_curso_id IS NOT NULL AND v_edicao_id IS NOT NULL THEN RAISE EXCEPTION 'Atividade invalida'; END IF;
  IF p_id IS NOT NULL AND v_original.tipo='entrada' THEN
    SELECT coalesce(sum(valor),0) INTO v_devolvido FROM public.lancamentos_financeiros
     WHERE estorno_de_id=p_id AND tipo='saida';
    IF p_tipo <> 'entrada' AND v_devolvido > 0 THEN RAISE EXCEPTION 'Entrada com devolucao nao pode mudar de tipo'; END IF;
    IF p_valor < v_devolvido THEN RAISE EXCEPTION 'Valor menor que as devolucoes ja registradas'; END IF;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.lancamentos_financeiros
      (tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,nucleo_id,categoria_id,
       aluno_id,curso_id,edicao_simposio_id,inscricao_id,finalidade,mes_referencia,comprovante_url,
       descricao,origem)
    VALUES
      (p_tipo,p_valor,p_data,p_mes_caixa,p_mes_caixa,v_precisao,v_unidade,v_nucleo_id,p_categoria_id,
       v_aluno_id,v_curso_id,v_edicao_id,p_inscricao_id,p_finalidade,p_mes_referencia,p_comprovante_url,
       nullif(trim(p_descricao),''),'manual') RETURNING * INTO v_registro;
  ELSE
    UPDATE public.lancamentos_financeiros SET
      tipo=p_tipo,valor=p_valor,data=p_data,competencia=p_mes_caixa,mes_caixa=p_mes_caixa,
      precisao_data=v_precisao,unidade=v_unidade,nucleo_id=v_nucleo_id,categoria_id=p_categoria_id,
      aluno_id=v_aluno_id,curso_id=v_curso_id,edicao_simposio_id=v_edicao_id,
      inscricao_id=p_inscricao_id,finalidade=p_finalidade,mes_referencia=p_mes_referencia,
      comprovante_url=p_comprovante_url,descricao=nullif(trim(p_descricao),'')
     WHERE id=p_id RETURNING * INTO v_registro;
  END IF;

  IF v_eh_pagamento THEN
    IF v_recebimento.id IS NULL THEN
      INSERT INTO public.recebimentos_its
        (pessoa_id,inscricao_id,curso_id,edicao_simposio_id,aluno_id,lancamento_id,
         valor,data_recebimento,mes_caixa,precisao_data,comprovante_url,tipo,origem)
      VALUES
        (v_pessoa_id,p_inscricao_id,v_curso_id,v_edicao_id,v_aluno_id,v_registro.id,
         p_valor,p_data,p_mes_caixa,v_precisao,p_comprovante_url,p_finalidade,'central');
    ELSE
      UPDATE public.recebimentos_its SET
        pessoa_id=v_pessoa_id,inscricao_id=p_inscricao_id,curso_id=v_curso_id,
        edicao_simposio_id=v_edicao_id,aluno_id=v_aluno_id,valor=p_valor,
        data_recebimento=p_data,mes_caixa=p_mes_caixa,precisao_data=v_precisao,
        comprovante_url=p_comprovante_url,tipo=p_finalidade,
        status=CASE WHEN (SELECT coalesce(sum(valor),0) FROM public.lancamentos_financeiros
                            WHERE estorno_de_id=v_registro.id)=p_valor THEN 'estornado' ELSE 'confirmado' END
       WHERE id=v_recebimento.id;
    END IF;
  END IF;
  IF p_id IS NULL THEN
    PERFORM public.registrar_auditoria('registro_financeiro',v_registro.id,'criado');
  ELSIF to_jsonb(v_original) IS DISTINCT FROM to_jsonb(v_registro) THEN
    PERFORM public.registrar_auditoria('registro_financeiro',v_registro.id,'editado',NULL,
      jsonb_build_object('antes',to_jsonb(v_original),'depois',to_jsonb(v_registro)));
    PERFORM public.marcar_relatorio_para_revisao(v_original.mes_caixa);
  END IF;
  PERFORM public.marcar_relatorio_para_revisao(p_mes_caixa);
  RETURN v_registro.id;
END; $$;

REVOKE ALL ON FUNCTION public.salvar_movimentacao_its(UUID,TEXT,NUMERIC,DATE,DATE,UUID,TEXT,UUID,UUID,UUID,UUID,TEXT,DATE,TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_movimentacao_its(UUID,TEXT,NUMERIC,DATE,DATE,UUID,TEXT,UUID,UUID,UUID,UUID,TEXT,DATE,TEXT,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.devolver_movimentacao_its(
  p_entrada_id UUID,p_valor NUMERIC,p_data DATE,p_categoria_id UUID,p_descricao TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_entrada public.lancamentos_financeiros%ROWTYPE; v_categoria public.categorias_financeiras%ROWTYPE;
  v_total NUMERIC; v_id UUID; v_recebimento_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_valor IS NULL OR p_valor<=0 OR p_data IS NULL THEN RAISE EXCEPTION 'Valor e data obrigatorios'; END IF;
  SELECT * INTO v_entrada FROM public.lancamentos_financeiros WHERE id=p_entrada_id FOR UPDATE;
  IF NOT FOUND OR v_entrada.tipo<>'entrada' THEN RAISE EXCEPTION 'Entrada nao encontrada'; END IF;
  SELECT * INTO v_categoria FROM public.categorias_financeiras WHERE id=p_categoria_id AND tipo='saida' AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selecione uma categoria ativa de saida'; END IF;
  SELECT coalesce(sum(valor),0) INTO v_total FROM public.lancamentos_financeiros
   WHERE estorno_de_id=p_entrada_id AND tipo='saida';
  IF v_total+p_valor>v_entrada.valor THEN RAISE EXCEPTION 'Devolucao excede o valor recebido'; END IF;
  INSERT INTO public.lancamentos_financeiros
    (tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,nucleo_id,categoria_id,
     aluno_id,curso_id,edicao_simposio_id,inscricao_id,descricao,origem,estorno_de_id)
  VALUES
    ('saida',p_valor,p_data,date_trunc('month',p_data)::date,date_trunc('month',p_data)::date,
     'dia',v_entrada.unidade,v_entrada.nucleo_id,p_categoria_id,v_entrada.aluno_id,
     v_entrada.curso_id,v_entrada.edicao_simposio_id,v_entrada.inscricao_id,
     coalesce(nullif(trim(p_descricao),''),'Devolucao de recebimento'),'estorno',p_entrada_id)
  RETURNING id INTO v_id;
  SELECT id INTO v_recebimento_id FROM public.recebimentos_its WHERE lancamento_id=p_entrada_id;
  IF v_recebimento_id IS NOT NULL AND v_total+p_valor=v_entrada.valor THEN
    UPDATE public.recebimentos_its SET status='estornado' WHERE id=v_recebimento_id;
  END IF;
  PERFORM public.registrar_auditoria('registro_financeiro',v_id,'devolucao',NULL,
    jsonb_build_object('entrada_id',p_entrada_id,'valor',p_valor));
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.devolver_movimentacao_its(UUID,NUMERIC,DATE,UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.devolver_movimentacao_its(UUID,NUMERIC,DATE,UUID,TEXT) TO authenticated;

-- Não manter caminhos paralelos de criação ou correção econômica.
REVOKE EXECUTE ON FUNCTION public.criar_registro_financeiro(TEXT,NUMERIC,DATE,UUID,TEXT,UUID,TEXT,TEXT,UUID,UUID) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.corrigir_registro_financeiro(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_recebimento_its(UUID,NUMERIC,DATE,TEXT,JSONB,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.estornar_recebimento_its(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.atribuir_mensalidade_its(UUID,DATE,NUMERIC) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.retirar_atribuicao_its(UUID,TEXT) FROM PUBLIC,anon,authenticated;

NOTIFY pgrst, 'reload schema';
