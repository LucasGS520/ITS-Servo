-- Inscricoes: decisoes operacionais independentes do caixa.
CREATE TABLE IF NOT EXISTS public.isencoes_inscricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  finalidade TEXT NOT NULL CHECK (finalidade IN ('matricula','mensalidade','inscricao_evento')),
  mes_referencia DATE,
  motivo TEXT NOT NULL CHECK (length(trim(motivo)) > 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((finalidade = 'mensalidade' AND mes_referencia IS NOT NULL AND mes_referencia = date_trunc('month',mes_referencia)::date)
      OR (finalidade <> 'mensalidade' AND mes_referencia IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS isencoes_inscricao_ativas_its
  ON public.isencoes_inscricao(inscricao_id,finalidade,coalesce(mes_referencia,DATE '0001-01-01')) WHERE ativo;
ALTER TABLE public.isencoes_inscricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read isencoes" ON public.isencoes_inscricao FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.isencoes_inscricao TO authenticated;

CREATE TABLE IF NOT EXISTS public.comprovantes_inscricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  caminho TEXT NOT NULL UNIQUE,
  origem TEXT NOT NULL CHECK (origem IN ('site','historico')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.comprovantes_inscricao(inscricao_id,caminho,origem)
  SELECT id,comprovante_url,'historico' FROM public.inscricoes WHERE comprovante_url IS NOT NULL
  ON CONFLICT(caminho) DO NOTHING;
ALTER TABLE public.comprovantes_inscricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read comprovantes inscricao" ON public.comprovantes_inscricao FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.comprovantes_inscricao TO authenticated;

CREATE TABLE IF NOT EXISTS public.solicitacoes_cancelamento_inscricao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada')),
  motivo TEXT,
  solicitada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvida_em TIMESTAMPTZ,
  resolvida_por UUID DEFAULT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS solicitacoes_cancelamento_pendentes_its
  ON public.solicitacoes_cancelamento_inscricao(inscricao_id) WHERE status='pendente';
ALTER TABLE public.solicitacoes_cancelamento_inscricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read solicitacoes cancelamento" ON public.solicitacoes_cancelamento_inscricao
  FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.solicitacoes_cancelamento_inscricao TO authenticated;

-- O pedido e sua trilha de auditoria precisam ser gravados juntos.
CREATE FUNCTION public.auditar_pedido_cancelamento_inscricao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.registrar_auditoria('matricula',NEW.inscricao_id,
    'cancelamento_solicitado_publicamente',NULL,jsonb_build_object('solicitacao_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER auditar_pedido_cancelamento_inscricao
  AFTER INSERT ON public.solicitacoes_cancelamento_inscricao
  FOR EACH ROW EXECUTE FUNCTION public.auditar_pedido_cancelamento_inscricao();

-- Contador usado pelas Edge Functions publicas. Somente service_role grava.
CREATE TABLE IF NOT EXISTS public.interacoes_inscricao_hits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip TEXT NOT NULL,
  acao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interacoes_inscricao_hits_ip_idx ON public.interacoes_inscricao_hits(ip,acao,created_at DESC);
ALTER TABLE public.interacoes_inscricao_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.interacoes_inscricao_hits FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' AND NEW.destino='curso' THEN
    INSERT INTO public.alunos(nome,unidade,nucleo_id,inscricao_id,pessoa_id,curso_id,ativo,situacao,primeira_competencia)
    VALUES(NEW.nome_completo,CASE WHEN NEW.modalidade='correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END,
      NEW.nucleo_id,NEW.id,NEW.pessoa_id,NEW.curso_id,true,'ativo',NEW.primeira_competencia)
    ON CONFLICT(inscricao_id) DO UPDATE SET nome=excluded.nome,unidade=excluded.unidade,nucleo_id=excluded.nucleo_id,
      pessoa_id=excluded.pessoa_id,curso_id=excluded.curso_id,ativo=true,situacao='ativo',primeira_competencia=excluded.primeira_competencia;
  ELSIF OLD.status='confirmada' AND NEW.status IS DISTINCT FROM 'confirmada' THEN
    UPDATE public.alunos SET ativo=false,situacao='cancelado' WHERE inscricao_id=NEW.id;
  END IF;
  RETURN NEW;
END; $$;

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
  IF v_i.destino='simposio' THEN SELECT valor INTO v_referencia FROM public.edicoes_simposio WHERE id=v_i.edicao_simposio_id;
  ELSE SELECT taxa_matricula INTO v_referencia FROM public.cursos WHERE id=v_i.curso_id; END IF;
  SELECT coalesce(sum(valor),0) INTO v_recebido_item FROM public.lancamentos_financeiros
   WHERE inscricao_id=p_inscricao_id AND tipo='entrada' AND finalidade=v_finalidade;
  SELECT v_recebido_item-coalesce(sum(d.valor),0) INTO v_recebido_item FROM public.lancamentos_financeiros d
   JOIN public.lancamentos_financeiros e ON e.id=d.estorno_de_id
   WHERE e.inscricao_id=p_inscricao_id AND e.finalidade=v_finalidade AND d.tipo='saida';
  v_contexto := CASE
    WHEN EXISTS(SELECT 1 FROM public.isencoes_inscricao WHERE inscricao_id=p_inscricao_id AND finalidade=v_finalidade AND ativo) THEN 'isenta'
    WHEN v_recebido_item<=0 THEN 'sem_recebimento'
    WHEN v_referencia IS NULL OR v_referencia<=0 THEN 'valor_nao_configurado'
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
REVOKE ALL ON FUNCTION public.confirmar_inscricao_its(UUID,DATE,BOOLEAN,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirmar_inscricao_its(UUID,DATE,BOOLEAN,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.atualizar_atendimento(
  p_inscricao_id UUID,p_nome_completo TEXT,p_telefone TEXT,p_email TEXT,
  p_data_nascimento DATE,p_escolaridade TEXT,p_motivo TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i public.inscricoes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_i FROM public.inscricoes WHERE id=p_inscricao_id FOR UPDATE;
  IF NOT FOUND OR v_i.status='cancelado' THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  IF length(trim(p_nome_completo))<3 OR nullif(trim(p_telefone),'') IS NULL OR nullif(trim(p_email),'') IS NULL THEN
    RAISE EXCEPTION 'Informe nome, telefone e email'; END IF;
  UPDATE public.pessoas SET nome_completo=trim(p_nome_completo),telefone=p_telefone,email=trim(p_email),
    data_nascimento=p_data_nascimento,escolaridade=p_escolaridade WHERE id=v_i.pessoa_id;
  UPDATE public.inscricoes SET nome_completo=trim(p_nome_completo),telefone=p_telefone,email=trim(p_email),
    data_nascimento=p_data_nascimento,escolaridade=p_escolaridade WHERE pessoa_id=v_i.pessoa_id;
  UPDATE public.alunos SET nome=trim(p_nome_completo) WHERE inscricao_id=p_inscricao_id;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'dados_atualizados',nullif(trim(p_motivo),''));
END; $$;

CREATE FUNCTION public.salvar_isencao_inscricao(p_inscricao_id UUID,p_finalidade TEXT,p_mes_referencia DATE,p_motivo TEXT,p_ativo BOOLEAN DEFAULT true)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i public.inscricoes%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_i FROM public.inscricoes WHERE id=p_inscricao_id FOR UPDATE;
  IF NOT FOUND OR v_i.status='cancelado' THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  IF (v_i.destino='simposio' AND p_finalidade<>'inscricao_evento') OR
     (v_i.destino='curso' AND p_finalidade NOT IN ('matricula','mensalidade')) OR
     (p_finalidade='mensalidade' AND (p_mes_referencia IS NULL OR p_mes_referencia<>date_trunc('month',p_mes_referencia)::date)) OR
     (p_finalidade<>'mensalidade' AND p_mes_referencia IS NOT NULL) THEN
    RAISE EXCEPTION 'Isencao incompatível com a atividade'; END IF;
  IF p_ativo THEN
    INSERT INTO public.isencoes_inscricao(inscricao_id,finalidade,mes_referencia,motivo)
    VALUES(p_inscricao_id,p_finalidade,p_mes_referencia,trim(p_motivo)) RETURNING id INTO v_id;
  ELSE
    UPDATE public.isencoes_inscricao SET ativo=false WHERE inscricao_id=p_inscricao_id AND finalidade=p_finalidade
      AND mes_referencia IS NOT DISTINCT FROM p_mes_referencia AND ativo RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Isencao nao encontrada'; END IF;
  END IF;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,CASE WHEN p_ativo THEN 'isencao_registrada' ELSE 'isencao_revogada' END,
    trim(p_motivo),jsonb_build_object('finalidade',p_finalidade,'mes_referencia',p_mes_referencia,'isencao_id',v_id));
END; $$;
REVOKE ALL ON FUNCTION public.salvar_isencao_inscricao(UUID,TEXT,DATE,TEXT,BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_isencao_inscricao(UUID,TEXT,DATE,TEXT,BOOLEAN) TO authenticated;

CREATE FUNCTION public.marcar_pagamento_nao_identificado_its(p_inscricao_id UUID,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  UPDATE public.inscricoes SET status='pagamento_nao_identificado'
   WHERE id=p_inscricao_id AND status='comprovante_enviado' AND comprovante_url IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comprovante indisponivel para analise'; END IF;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'pagamento_nao_identificado',trim(p_motivo));
END; $$;
REVOKE ALL ON FUNCTION public.marcar_pagamento_nao_identificado_its(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.marcar_pagamento_nao_identificado_its(UUID,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancelar_inscricao_interna(p_inscricao_id UUID,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  UPDATE public.inscricoes SET status='cancelado' WHERE id=p_inscricao_id AND status<>'cancelado';
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  UPDATE public.solicitacoes_cancelamento_inscricao SET status='aprovada',resolvida_em=now(),resolvida_por=auth.uid()
   WHERE inscricao_id=p_inscricao_id AND status='pendente';
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'cancelada',trim(p_motivo));
END; $$;

CREATE FUNCTION public.resolver_cancelamento_inscricao(p_solicitacao_id UUID,p_aprovar BOOLEAN,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  SELECT inscricao_id INTO v_i FROM public.solicitacoes_cancelamento_inscricao
   WHERE id=p_solicitacao_id AND status='pendente' FOR UPDATE;
  IF v_i IS NULL THEN RAISE EXCEPTION 'Solicitacao indisponivel'; END IF;
  IF p_aprovar THEN
    PERFORM public.cancelar_inscricao_interna(v_i,p_motivo);
  ELSE
    UPDATE public.solicitacoes_cancelamento_inscricao SET status='rejeitada',resolvida_em=now(),resolvida_por=auth.uid(),motivo=trim(p_motivo)
     WHERE id=p_solicitacao_id;
    PERFORM public.registrar_auditoria('matricula',v_i,'cancelamento_rejeitado',trim(p_motivo));
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.resolver_cancelamento_inscricao(UUID,BOOLEAN,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolver_cancelamento_inscricao(UUID,BOOLEAN,TEXT) TO authenticated;

-- O caminho publico antigo cancelava imediatamente e contornaria a revisao.
REVOKE ALL ON FUNCTION public.cancelar_inscricao(TEXT,TEXT) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.registrar_comprovante_publico_its(p_numero TEXT,p_comprovante_path TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT id INTO v_id FROM public.inscricoes WHERE numero_inscricao=p_numero
    AND status IN ('em_analise','comprovante_enviado','pagamento_nao_identificado','confirmada') FOR UPDATE;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  UPDATE public.inscricoes SET comprovante_url=p_comprovante_path,
    status=CASE WHEN status='confirmada' THEN status ELSE 'comprovante_enviado' END WHERE id=v_id;
  INSERT INTO public.comprovantes_inscricao(inscricao_id,caminho,origem) VALUES(v_id,p_comprovante_path,'site');
  PERFORM public.registrar_auditoria('matricula',v_id,'comprovante_enviado_publicamente');
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_comprovante_publico_its(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_comprovante_publico_its(TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.registrar_comprovante_operacional(p_numero TEXT,p_token_hash TEXT,p_comprovante_path TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  IF current_setting('request.jwt.claim.role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT id INTO v_id FROM public.inscricoes WHERE numero_inscricao=p_numero AND consulta_token_hash=p_token_hash
   AND status IN ('em_analise','comprovante_enviado','pagamento_nao_identificado','confirmada') FOR UPDATE;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Inscricao nao encontrada ou estado invalido'; END IF;
  UPDATE public.inscricoes SET comprovante_url=p_comprovante_path,
    status=CASE WHEN status='confirmada' THEN status ELSE 'comprovante_enviado' END WHERE id=v_id;
  INSERT INTO public.comprovantes_inscricao(inscricao_id,caminho,origem) VALUES(v_id,p_comprovante_path,'site');
  PERFORM public.registrar_auditoria('matricula',v_id,'comprovante_enviado');
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_comprovante_operacional(TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_comprovante_operacional(TEXT,TEXT,TEXT) TO service_role;
