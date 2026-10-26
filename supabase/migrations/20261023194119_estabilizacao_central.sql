-- Referência preservada por inscrição; valores históricos ausentes não são inventados.
ALTER TABLE public.inscricoes
 ADD COLUMN valor_referencia numeric CHECK (valor_referencia >= 0),
 ADD COLUMN valor_referencia_em timestamptz,
 ADD COLUMN valor_referencia_origem text CHECK (valor_referencia_origem IN ('catalogo','transicao','correcao'));
UPDATE public.inscricoes i SET valor_referencia = CASE WHEN curso_id IS NOT NULL
 THEN (SELECT taxa_matricula FROM public.cursos WHERE id=i.curso_id)
 ELSE (SELECT valor FROM public.edicoes_simposio WHERE id=i.edicao_simposio_id) END,
 valor_referencia_em=now(), valor_referencia_origem='transicao';
CREATE FUNCTION public.capturar_preco_inscricao_its() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 NEW.valor_referencia := CASE WHEN NEW.curso_id IS NOT NULL
 THEN (SELECT taxa_matricula FROM public.cursos WHERE id=NEW.curso_id)
 ELSE (SELECT valor FROM public.edicoes_simposio WHERE id=NEW.edicao_simposio_id) END;
 NEW.valor_referencia_em := now(); NEW.valor_referencia_origem := 'catalogo';
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capturar_preco_inscricao_its() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capturar_preco_inscricao BEFORE INSERT ON public.inscricoes
 FOR EACH ROW EXECUTE FUNCTION public.capturar_preco_inscricao_its();
CREATE FUNCTION public.corrigir_preco_inscricao_its(p_id uuid,p_valor numeric,p_motivo text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_antes jsonb;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 IF nullif(trim(p_motivo),'') IS NULL OR p_valor<0 THEN RAISE EXCEPTION 'Valor ou justificativa inválida'; END IF;
 SELECT to_jsonb(i) INTO v_antes FROM public.inscricoes i WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
 UPDATE public.inscricoes SET valor_referencia=p_valor,valor_referencia_em=now(),valor_referencia_origem='correcao' WHERE id=p_id;
 PERFORM public.registrar_auditoria('matricula',p_id,'valor_referencia_corrigido',trim(p_motivo),
 jsonb_build_object('antes',v_antes->'valor_referencia','depois',p_valor));
END; $$;
REVOKE ALL ON FUNCTION public.corrigir_preco_inscricao_its(uuid,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.corrigir_preco_inscricao_its(uuid,numeric,text) TO authenticated;

-- Registro privado de repetição: uma solicitação produz um único efeito econômico.
CREATE TABLE public.operacoes_financeiras_its (
 id uuid PRIMARY KEY, usuario_id uuid NOT NULL, tipo text NOT NULL,
 dados jsonb NOT NULL, movimento_id uuid NOT NULL REFERENCES public.lancamentos_financeiros(id),
 criada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operacoes_financeiras_its ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operacoes_financeiras_its FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.executar_movimento_its(p_operacao_id uuid,p_tipo text,p_dados jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_operacao public.operacoes_financeiras_its%ROWTYPE; v_id uuid;
BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 IF p_operacao_id IS NULL OR p_dados IS NULL OR p_tipo NOT IN ('salvar','devolver') THEN RAISE EXCEPTION 'Operação inválida'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operacao_id::text,0));
 SELECT * INTO v_operacao FROM public.operacoes_financeiras_its WHERE id=p_operacao_id;
 IF FOUND THEN
   IF v_operacao.usuario_id<>auth.uid() OR v_operacao.tipo<>p_tipo OR v_operacao.dados<>p_dados THEN
     RAISE EXCEPTION 'Esta solicitação já foi utilizada com outros dados'; END IF;
   RETURN v_operacao.movimento_id;
 END IF;
 IF p_tipo='devolver' THEN
   v_id := public.devolver_movimentacao_its((p_dados->>'p_entrada_id')::uuid,(p_dados->>'p_valor')::numeric,
    (p_dados->>'p_data')::date,(p_dados->>'p_categoria_id')::uuid,p_dados->>'p_descricao');
 ELSE
   v_id := public.salvar_movimentacao_its((p_dados->>'p_id')::uuid,p_dados->>'p_tipo',(p_dados->>'p_valor')::numeric,
    (p_dados->>'p_data')::date,(p_dados->>'p_mes_caixa')::date,(p_dados->>'p_categoria_id')::uuid,
    p_dados->>'p_unidade',(p_dados->>'p_curso_id')::uuid,(p_dados->>'p_edicao_simposio_id')::uuid,
    (p_dados->>'p_inscricao_id')::uuid,(p_dados->>'p_aluno_historico_id')::uuid,p_dados->>'p_finalidade',
    (p_dados->>'p_mes_referencia')::date,p_dados->>'p_comprovante_url',p_dados->>'p_descricao');
 END IF;
 INSERT INTO public.operacoes_financeiras_its(id,usuario_id,tipo,dados,movimento_id)
 VALUES(p_operacao_id,auth.uid(),p_tipo,p_dados,v_id);
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.executar_movimento_its(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.executar_movimento_its(uuid,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirmar_inscricao_its(p_inscricao_id UUID,p_primeira_competencia DATE DEFAULT NULL,p_isento BOOLEAN DEFAULT false,p_motivo TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i public.inscricoes%ROWTYPE; v_total NUMERIC; v_devolvido NUMERIC; v_recebido_item NUMERIC;
  v_referencia NUMERIC; v_contexto TEXT; v_finalidade TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_i FROM public.inscricoes WHERE id=p_inscricao_id FOR UPDATE;
  IF NOT FOUND OR v_i.status='cancelado' THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  IF v_i.status='confirmada' THEN RAISE EXCEPTION 'Inscricao ja confirmada'; END IF;
  IF p_primeira_competencia IS NOT NULL AND p_primeira_competencia <> date_trunc('month',p_primeira_competencia)::date THEN
    RAISE EXCEPTION 'Primeiro mes invalido'; END IF;
  -- Isencoes novas sao registradas por item. O indicador legado permanece sem alterar seu alcance historico.
  IF p_isento THEN RAISE EXCEPTION 'Registre a isencao por item antes de confirmar'; END IF;
  SELECT coalesce(sum(valor),0) INTO v_total FROM public.lancamentos_financeiros
   WHERE inscricao_id=p_inscricao_id AND tipo='entrada' AND estorno_de_id IS NULL;
  SELECT coalesce(sum(d.valor),0) INTO v_devolvido FROM public.lancamentos_financeiros d
   JOIN public.lancamentos_financeiros e ON e.id=d.estorno_de_id
   WHERE e.inscricao_id=p_inscricao_id AND d.tipo='saida';
  v_finalidade := CASE WHEN v_i.destino='simposio' THEN 'inscricao_evento' ELSE 'matricula' END;
  v_referencia := v_i.valor_referencia;
  SELECT coalesce(sum(valor),0) INTO v_recebido_item FROM public.lancamentos_financeiros
   WHERE inscricao_id=p_inscricao_id AND tipo='entrada' AND finalidade=v_finalidade;
  SELECT v_recebido_item-coalesce(sum(d.valor),0) INTO v_recebido_item FROM public.lancamentos_financeiros d
   JOIN public.lancamentos_financeiros e ON e.id=d.estorno_de_id
   WHERE e.inscricao_id=p_inscricao_id AND e.finalidade=v_finalidade AND d.tipo='saida';
  v_contexto := CASE
    WHEN EXISTS(SELECT 1 FROM public.isencoes_inscricao WHERE inscricao_id=p_inscricao_id AND finalidade=v_finalidade AND ativo) THEN 'isenta'
    WHEN v_i.isento THEN 'isencao_antiga_revisar_alcance'
    WHEN v_referencia IS NULL THEN 'valor_nao_configurado'
    WHEN v_referencia=0 THEN 'gratuita'
    WHEN v_recebido_item<=0 THEN 'sem_recebimento'
    WHEN v_recebido_item<v_referencia THEN 'recebimento_parcial'
    ELSE 'valor_recebido' END;
  UPDATE public.inscricoes SET status='confirmada', primeira_competencia=coalesce(p_primeira_competencia,v_i.primeira_competencia)
   WHERE id=p_inscricao_id;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'confirmada_pela_equipe',NULL,
    jsonb_build_object('contexto_financeiro',v_contexto,'recebido_liquido',v_total-v_devolvido,
      'valor_aplicavel',v_referencia,'recebido_no_item',v_recebido_item,
      'comprovante_enviado',v_i.comprovante_url IS NOT NULL,'isencoes',
      (SELECT count(*) FROM public.isencoes_inscricao WHERE inscricao_id=p_inscricao_id AND ativo)));
END; $$;

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
  -- Editar um pagamento do mesmo vínculo mantém a unidade histórica, mesmo
  -- quando o aluno passou a outro núcleo após o recebimento.
  IF p_id IS NOT NULL AND ((p_inscricao_id IS NOT NULL AND p_inscricao_id=v_original.inscricao_id)
     OR (p_aluno_historico_id IS NOT NULL AND p_aluno_historico_id=v_original.aluno_id)) THEN
    v_unidade := v_original.unidade;
    v_nucleo_id := v_original.nucleo_id;
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
