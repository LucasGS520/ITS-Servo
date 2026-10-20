-- Alinhamento ITS: o caixa registra recebimentos, nunca emite cobrancas.
-- A migracao mantem tabelas legadas vazias para compatibilidade historica.
ALTER TABLE public.pessoas ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.pessoas ADD COLUMN IF NOT EXISTS identidade_pendente BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pessoas ADD COLUMN IF NOT EXISTS origem_referencia TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS pessoas_origem_referencia_key ON public.pessoas(origem_referencia) WHERE origem_referencia IS NOT NULL;

ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS taxa_matricula NUMERIC(10,2) CHECK (taxa_matricula IS NULL OR taxa_matricula >= 0);
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS mensalidade_referencia NUMERIC(10,2) CHECK (mensalidade_referencia IS NULL OR mensalidade_referencia >= 0);
UPDATE public.cursos SET taxa_matricula = 40, mensalidade_referencia = 150, valor = NULL WHERE codigo = 'teologico';

ALTER TABLE public.inscricoes ALTER COLUMN status SET DEFAULT 'em_analise';
ALTER TABLE public.inscricoes DROP CONSTRAINT IF EXISTS inscricoes_status_check;
ALTER TABLE public.inscricoes ADD CONSTRAINT inscricoes_status_check CHECK (status IN
  ('em_analise','comprovante_enviado','confirmada','cancelado','pagamento_nao_identificado'));
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS origem_cadastro TEXT NOT NULL DEFAULT 'site' CHECK (origem_cadastro IN ('site','central','historico'));
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS isento BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS motivo_isencao TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS primeira_competencia DATE CHECK (primeira_competencia IS NULL OR primeira_competencia = date_trunc('month', primeira_competencia)::date);
ALTER TABLE public.inscricoes ADD CONSTRAINT inscricoes_isencao_motivo_check CHECK (NOT isento OR nullif(trim(motivo_isencao), '') IS NOT NULL);

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS pessoa_id UUID REFERENCES public.pessoas(id) ON DELETE RESTRICT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS situacao TEXT NOT NULL DEFAULT 'pendente_validacao' CHECK (situacao IN ('pendente_validacao','ativo','pausado','concluido','cancelado'));
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS primeira_competencia DATE CHECK (primeira_competencia IS NULL OR primeira_competencia = date_trunc('month', primeira_competencia)::date);
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS origem_referencia TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS alunos_origem_referencia_key ON public.alunos(origem_referencia) WHERE origem_referencia IS NOT NULL;

ALTER TABLE public.lancamentos_financeiros ALTER COLUMN data DROP NOT NULL;
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS mes_caixa DATE;
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS precisao_data TEXT NOT NULL DEFAULT 'dia' CHECK (precisao_data IN ('dia','mes'));
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS origem_referencia TEXT;
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS conciliacao_status TEXT NOT NULL DEFAULT 'conciliado' CHECK (conciliacao_status IN ('conciliado','provisorio','divergente'));
UPDATE public.lancamentos_financeiros SET mes_caixa = date_trunc('month', data)::date WHERE mes_caixa IS NULL AND data IS NOT NULL;
ALTER TABLE public.lancamentos_financeiros ALTER COLUMN mes_caixa SET NOT NULL;
ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_mes_caixa_check CHECK (mes_caixa = date_trunc('month', mes_caixa)::date);
ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_precisao_data_check CHECK ((precisao_data = 'dia' AND data IS NOT NULL AND date_trunc('month', data)::date = mes_caixa) OR (precisao_data = 'mes' AND data IS NULL));
CREATE UNIQUE INDEX IF NOT EXISTS lancamentos_origem_referencia_key ON public.lancamentos_financeiros(origem_referencia) WHERE origem_referencia IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.recebimentos_its (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID REFERENCES public.pessoas(id) ON DELETE RESTRICT,
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE RESTRICT,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT,
  edicao_simposio_id UUID REFERENCES public.edicoes_simposio(id) ON DELETE RESTRICT,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE RESTRICT,
  lancamento_id UUID UNIQUE REFERENCES public.lancamentos_financeiros(id) ON DELETE RESTRICT,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data_recebimento DATE,
  mes_caixa DATE NOT NULL CHECK (mes_caixa = date_trunc('month', mes_caixa)::date),
  precisao_data TEXT NOT NULL CHECK (precisao_data IN ('dia','mes')),
  comprovante_url TEXT,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado','estornado')),
  tipo TEXT NOT NULL DEFAULT 'mensalidade' CHECK (tipo IN ('matricula','mensalidade','inscricao_evento','outro')),
  origem TEXT NOT NULL DEFAULT 'central' CHECK (origem IN ('central','historico')),
  origem_referencia TEXT UNIQUE,
  registrado_por UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((precisao_data = 'dia' AND data_recebimento IS NOT NULL AND date_trunc('month', data_recebimento)::date = mes_caixa) OR (precisao_data = 'mes' AND data_recebimento IS NULL))
);
CREATE INDEX IF NOT EXISTS recebimentos_its_pessoa_mes_idx ON public.recebimentos_its(pessoa_id, mes_caixa);
CREATE INDEX IF NOT EXISTS recebimentos_its_inscricao_idx ON public.recebimentos_its(inscricao_id);
ALTER TABLE public.recebimentos_its ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage recebimentos ITS" ON public.recebimentos_its FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.atribuicoes_mensalidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recebimento_id UUID NOT NULL REFERENCES public.recebimentos_its(id) ON DELETE RESTRICT,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
  competencia DATE NOT NULL CHECK (competencia = date_trunc('month', competencia)::date),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recebimento_id, aluno_id, competencia)
);
CREATE INDEX IF NOT EXISTS atribuicoes_aluno_competencia_idx ON public.atribuicoes_mensalidade(aluno_id, competencia);
ALTER TABLE public.atribuicoes_mensalidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage atribuicoes" ON public.atribuicoes_mensalidade FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.itens_simposio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edicao_id UUID NOT NULL REFERENCES public.edicoes_simposio(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('doacao_bem_servico','receita_detalhe','despesa_detalhe')),
  valor NUMERIC(10,2) CHECK (valor IS NULL OR valor > 0),
  doador TEXT,
  origem_referencia TEXT UNIQUE,
  contabilizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.itens_simposio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage itens simposio" ON public.itens_simposio FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER TABLE public.edicoes_simposio ADD COLUMN IF NOT EXISTS inscritos_historicos INTEGER CHECK (inscritos_historicos IS NULL OR inscritos_historicos >= 0);
ALTER TABLE public.edicoes_simposio ADD COLUMN IF NOT EXISTS pagantes_historicos INTEGER CHECK (pagantes_historicos IS NULL OR pagantes_historicos >= 0);
ALTER TABLE public.edicoes_simposio ADD COLUMN IF NOT EXISTS isentos_historicos INTEGER CHECK (isentos_historicos IS NULL OR isentos_historicos >= 0);
ALTER TABLE public.edicoes_simposio ADD COLUMN IF NOT EXISTS origem_referencia TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS public.pendencias_conciliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  valor_anual NUMERIC(12,2),
  valor_detalhe NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','resolvida')),
  resolucao TEXT,
  resolvida_por UUID,
  resolvida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pendencias_conciliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pendencias" ON public.pendencias_conciliacao FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.importacoes_its (
  fonte TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  carregada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.importacoes_its ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read importacoes" ON public.importacoes_its FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.saldos_iniciais_its (
  ano INTEGER PRIMARY KEY CHECK (ano >= 2000),
  valor NUMERIC(12,2) NOT NULL,
  fonte TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saldos_iniciais_its ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage saldos iniciais" ON public.saldos_iniciais_its FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Funcoes legadas de cobranca deixam de ser caminhos operacionais.
REVOKE EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.salvar_cobranca(UUID, UUID, UUID, UUID, UUID, UUID, TEXT, NUMERIC, DATE, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alterar_status_matricula(UUID,TEXT,TEXT) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.criar_registro_financeiro(
  p_tipo TEXT,p_valor NUMERIC,p_data DATE,p_categoria_id UUID,p_unidade TEXT DEFAULT NULL,
  p_aluno_id UUID DEFAULT NULL,p_descricao TEXT DEFAULT NULL,p_motivo TEXT DEFAULT NULL,
  p_curso_id UUID DEFAULT NULL,p_edicao_simposio_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_tipo NOT IN ('entrada','saida') OR p_valor <= 0 OR p_data IS NULL THEN RAISE EXCEPTION 'Movimento invalido'; END IF;
  INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,categoria_id,aluno_id,descricao,motivo,curso_id,edicao_simposio_id,origem)
  VALUES(p_tipo,p_valor,p_data,date_trunc('month',p_data)::date,date_trunc('month',p_data)::date,'dia',p_unidade,p_categoria_id,p_aluno_id,p_descricao,p_motivo,p_curso_id,p_edicao_simposio_id,'manual') RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('registro_financeiro',v_id,'criado',p_motivo);
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.corrigir_registro_financeiro(p_registro_id UUID,p_motivo TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_original public.lancamentos_financeiros%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  SELECT * INTO v_original FROM public.lancamentos_financeiros WHERE id=p_registro_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registro nao encontrado'; END IF;
  IF v_original.origem='legado' THEN RAISE EXCEPTION 'Historico importado exige conciliacao da fonte antes de correcao'; END IF;
  IF v_original.origem='pagamento' THEN RAISE EXCEPTION 'Use o estorno do recebimento'; END IF;
  IF EXISTS(SELECT 1 FROM public.lancamentos_financeiros WHERE estorno_de_id=p_registro_id) THEN RAISE EXCEPTION 'Registro ja estornado'; END IF;
  INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,nucleo_id,categoria_id,aluno_id,curso_id,edicao_simposio_id,descricao,estorno_de_id,motivo,origem)
  VALUES(CASE WHEN v_original.tipo='entrada' THEN 'saida' ELSE 'entrada' END,v_original.valor,current_date,date_trunc('month',current_date)::date,date_trunc('month',current_date)::date,'dia',v_original.unidade,v_original.nucleo_id,v_original.categoria_id,v_original.aluno_id,v_original.curso_id,v_original.edicao_simposio_id,'Correcao de registro',v_original.id,p_motivo,'estorno') RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('registro_financeiro',p_registro_id,'corrigido',p_motivo,jsonb_build_object('estorno_id',v_id));
  PERFORM public.marcar_relatorio_para_revisao(current_date);
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' AND NEW.destino='curso' THEN
    INSERT INTO public.alunos(nome,unidade,nucleo_id,inscricao_id,pessoa_id,curso_id,ativo,situacao,primeira_competencia)
    VALUES(NEW.nome_completo,CASE WHEN NEW.modalidade='correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END,NEW.nucleo_id,NEW.id,NEW.pessoa_id,NEW.curso_id,true,'ativo',NEW.primeira_competencia)
    ON CONFLICT(inscricao_id) DO UPDATE SET pessoa_id=excluded.pessoa_id,curso_id=excluded.curso_id,ativo=true,situacao='ativo',primeira_competencia=excluded.primeira_competencia;
  ELSIF OLD.status='confirmada' AND NEW.status IS DISTINCT FROM 'confirmada' THEN
    UPDATE public.alunos SET ativo=false,situacao='cancelado' WHERE inscricao_id=NEW.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.criar_matricula_operacional(
  p_nome_completo TEXT, p_cpf TEXT, p_telefone TEXT, p_email TEXT,
  p_data_nascimento DATE, p_escolaridade TEXT, p_modalidade TEXT, p_nucleo TEXT,
  p_destino TEXT, p_curso_codigo TEXT, p_edicao_simposio_id UUID, p_consulta_token_hash TEXT
) RETURNS TABLE(inscricao_id UUID, numero_inscricao TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pessoa UUID; v_curso UUID; v_edicao UUID; v_id UUID; v_numero TEXT;
BEGIN
  IF p_destino = 'curso' THEN
    SELECT id INTO v_curso FROM public.cursos WHERE codigo = p_curso_codigo AND ativo AND publico;
    IF v_curso IS NULL THEN RAISE EXCEPTION 'Este curso nao esta disponivel'; END IF;
  ELSIF p_destino = 'simposio' THEN
    SELECT id INTO v_edicao FROM public.edicoes_simposio WHERE id = p_edicao_simposio_id AND ativo AND publico;
    IF v_edicao IS NULL THEN RAISE EXCEPTION 'Esta edicao nao esta disponivel'; END IF;
  ELSE RAISE EXCEPTION 'Destino invalido'; END IF;
  INSERT INTO public.pessoas(cpf,nome_completo,telefone,email,data_nascimento,escolaridade)
  VALUES (p_cpf,trim(p_nome_completo),p_telefone,trim(p_email),p_data_nascimento,p_escolaridade)
  ON CONFLICT(cpf) DO UPDATE SET nome_completo=excluded.nome_completo,telefone=excluded.telefone,email=excluded.email,data_nascimento=excluded.data_nascimento,escolaridade=excluded.escolaridade
  RETURNING id INTO v_pessoa;
  IF EXISTS(SELECT 1 FROM public.inscricoes WHERE pessoa_id=v_pessoa AND status <> 'cancelado' AND (curso_id=v_curso AND v_curso IS NOT NULL OR edicao_simposio_id=v_edicao AND v_edicao IS NOT NULL)) THEN
    RAISE EXCEPTION 'Ja existe inscricao para esta pessoa e atividade';
  END IF;
  INSERT INTO public.inscricoes(nome_completo,cpf,telefone,email,data_nascimento,escolaridade,modalidade,nucleo,consulta_token_hash,pessoa_id,curso_id,edicao_simposio_id,destino,status,origem_cadastro)
  VALUES(trim(p_nome_completo),p_cpf,p_telefone,trim(p_email),p_data_nascimento,p_escolaridade,p_modalidade,CASE WHEN p_modalidade='presencial' THEN p_nucleo ELSE NULL END,p_consulta_token_hash,v_pessoa,v_curso,v_edicao,p_destino,'em_analise','site')
  RETURNING id,public.inscricoes.numero_inscricao INTO v_id,v_numero;
  RETURN QUERY SELECT v_id,v_numero;
END; $$;
REVOKE ALL ON FUNCTION public.criar_matricula_operacional(TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,TEXT,TEXT,UUID,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.criar_matricula_operacional(TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,TEXT,TEXT,UUID,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.registrar_comprovante_operacional(p_numero TEXT,p_token_hash TEXT,p_comprovante_path TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.inscricoes WHERE numero_inscricao=p_numero AND consulta_token_hash=p_token_hash AND status IN ('em_analise','comprovante_enviado','pagamento_nao_identificado') FOR UPDATE;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Inscricao nao encontrada ou estado invalido'; END IF;
  UPDATE public.inscricoes SET comprovante_url=p_comprovante_path,status='comprovante_enviado' WHERE id=v_id;
  PERFORM public.registrar_auditoria('matricula',v_id,'comprovante_enviado');
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_comprovante_operacional(TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_comprovante_operacional(TEXT,TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.cancelar_inscricao(p_numero TEXT,p_token TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.inscricoes WHERE numero_inscricao=p_numero AND consulta_token_hash=encode(digest(p_token,'sha256'),'hex') AND status IN ('em_analise','comprovante_enviado') FOR UPDATE;
  IF v_id IS NULL THEN RETURN false; END IF;
  UPDATE public.inscricoes SET status='cancelado' WHERE id=v_id;
  PERFORM public.registrar_auditoria('matricula',v_id,'cancelada_pelo_titular');
  RETURN true;
END; $$;

DROP FUNCTION IF EXISTS public.buscar_inscricao(TEXT,TEXT);
CREATE FUNCTION public.buscar_inscricao(p_numero TEXT,p_token TEXT)
RETURNS TABLE(numero_inscricao TEXT,nome_completo TEXT,email TEXT,telefone TEXT,cpf TEXT,data_nascimento DATE,escolaridade TEXT,modalidade TEXT,nucleo TEXT,status TEXT,comprovante_url TEXT,created_at TIMESTAMPTZ,destino TEXT,destino_nome TEXT,valor_devido NUMERIC,valor_pago NUMERIC,saldo_devedor NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions AS $$
 SELECT i.numero_inscricao,i.nome_completo,i.email,i.telefone,i.cpf,i.data_nascimento,i.escolaridade,i.modalidade,i.nucleo,i.status,i.comprovante_url,i.created_at,i.destino,coalesce(c.nome,e.nome),NULL::numeric,coalesce((SELECT sum(r.valor) FROM public.recebimentos_its r WHERE r.inscricao_id=i.id AND r.status='confirmado'),0),NULL::numeric
 FROM public.inscricoes i LEFT JOIN public.cursos c ON c.id=i.curso_id LEFT JOIN public.edicoes_simposio e ON e.id=i.edicao_simposio_id
 WHERE i.numero_inscricao=p_numero AND i.consulta_token_hash=encode(digest(p_token,'sha256'),'hex');
$$;
REVOKE ALL ON FUNCTION public.buscar_inscricao(TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_inscricao(TEXT,TEXT) TO anon,authenticated;

CREATE FUNCTION public.criar_inscricao_interna(p_nome TEXT,p_cpf TEXT,p_telefone TEXT,p_email TEXT,p_nascimento DATE,p_escolaridade TEXT,p_modalidade TEXT,p_nucleo TEXT,p_curso_id UUID,p_edicao_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_pessoa UUID; v_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF (p_curso_id IS NULL) = (p_edicao_id IS NULL) THEN RAISE EXCEPTION 'Informe apenas uma atividade'; END IF;
  IF p_cpf IS NULL OR length(regexp_replace(p_cpf,'\D','','g')) <> 11 THEN RAISE EXCEPTION 'CPF invalido'; END IF;
  INSERT INTO public.pessoas(cpf,nome_completo,telefone,email,data_nascimento,escolaridade)
  VALUES(regexp_replace(p_cpf,'\D','','g'),trim(p_nome),p_telefone,p_email,p_nascimento,p_escolaridade)
  ON CONFLICT(cpf) DO UPDATE SET nome_completo=excluded.nome_completo,telefone=excluded.telefone,email=excluded.email,data_nascimento=excluded.data_nascimento,escolaridade=excluded.escolaridade RETURNING id INTO v_pessoa;
  INSERT INTO public.inscricoes(nome_completo,cpf,telefone,email,data_nascimento,escolaridade,modalidade,nucleo,pessoa_id,curso_id,edicao_simposio_id,destino,status,origem_cadastro)
  VALUES(trim(p_nome),regexp_replace(p_cpf,'\D','','g'),p_telefone,p_email,p_nascimento,p_escolaridade,p_modalidade,CASE WHEN p_modalidade='presencial' THEN p_nucleo ELSE NULL END,v_pessoa,p_curso_id,p_edicao_id,CASE WHEN p_curso_id IS NULL THEN 'simposio' ELSE 'curso' END,'em_analise','central') RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('matricula',v_id,'criada_pela_central');
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.criar_inscricao_interna(TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.criar_inscricao_interna(TEXT,TEXT,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID,UUID) TO authenticated;

CREATE FUNCTION public.confirmar_inscricao_its(p_inscricao_id UUID,p_primeira_competencia DATE DEFAULT NULL,p_isento BOOLEAN DEFAULT false,p_motivo TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i public.inscricoes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_i FROM public.inscricoes WHERE id=p_inscricao_id FOR UPDATE;
  IF NOT FOUND OR v_i.status='cancelado' THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  IF v_i.destino='curso' AND (p_primeira_competencia IS NULL OR p_primeira_competencia <> date_trunc('month',p_primeira_competencia)::date) THEN RAISE EXCEPTION 'Informe o primeiro mes da mensalidade'; END IF;
  IF p_isento AND nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe o motivo da isencao'; END IF;
  UPDATE public.inscricoes SET status='confirmada',primeira_competencia=p_primeira_competencia,isento=p_isento,motivo_isencao=p_motivo WHERE id=p_inscricao_id;
  UPDATE public.alunos SET pessoa_id=v_i.pessoa_id,curso_id=v_i.curso_id,situacao='ativo',primeira_competencia=p_primeira_competencia WHERE inscricao_id=p_inscricao_id;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'confirmada_pela_equipe');
END; $$;
REVOKE ALL ON FUNCTION public.confirmar_inscricao_its(UUID,DATE,BOOLEAN,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirmar_inscricao_its(UUID,DATE,BOOLEAN,TEXT) TO authenticated;

CREATE FUNCTION public.cancelar_inscricao_interna(p_inscricao_id UUID,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  UPDATE public.inscricoes SET status='cancelado' WHERE id=p_inscricao_id AND status <> 'cancelado';
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscricao indisponivel'; END IF;
  PERFORM public.registrar_auditoria('matricula',p_inscricao_id,'cancelada',p_motivo);
END; $$;
REVOKE ALL ON FUNCTION public.cancelar_inscricao_interna(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancelar_inscricao_interna(UUID,TEXT) TO authenticated;

CREATE FUNCTION public.registrar_recebimento_its(p_inscricao_id UUID,p_valor NUMERIC,p_data DATE,p_tipo TEXT,p_atribuicoes JSONB DEFAULT '[]'::jsonb,p_comprovante TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_i public.inscricoes%ROWTYPE; v_aluno UUID; v_categoria UUID; v_lanc UUID; v_receb UUID; v_item JSONB; v_total NUMERIC := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF p_valor <= 0 OR p_data IS NULL THEN RAISE EXCEPTION 'Valor e data obrigatorios'; END IF;
  SELECT * INTO v_i FROM public.inscricoes WHERE id=p_inscricao_id AND status <> 'cancelado' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscricao nao encontrada'; END IF;
  SELECT id INTO v_aluno FROM public.alunos WHERE inscricao_id=p_inscricao_id;
  SELECT id INTO v_categoria FROM public.categorias_financeiras WHERE nome=CASE WHEN v_i.destino='simposio' THEN 'Simpósio' WHEN v_i.curso_id=(SELECT id FROM public.cursos WHERE codigo='teologico') THEN 'Curso Teológico' ELSE 'Capacitação de Obreiros' END AND tipo='entrada' LIMIT 1;
  IF v_categoria IS NULL THEN RAISE EXCEPTION 'Categoria financeira ausente'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_atribuicoes) LOOP
    IF p_tipo <> 'mensalidade' OR v_aluno IS NULL THEN RAISE EXCEPTION 'Atribuicao exige aluno e mensalidade'; END IF;
    IF (v_item->>'competencia')::date <> date_trunc('month',(v_item->>'competencia')::date)::date OR (v_item->>'valor')::numeric <= 0 THEN RAISE EXCEPTION 'Atribuicao invalida'; END IF;
    v_total := v_total + (v_item->>'valor')::numeric;
  END LOOP;
  IF v_total > p_valor THEN RAISE EXCEPTION 'Atribuicoes excedem o recebido'; END IF;
  INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,nucleo_id,categoria_id,aluno_id,curso_id,edicao_simposio_id,descricao,origem)
  VALUES('entrada',p_valor,p_data,date_trunc('month',p_data)::date,date_trunc('month',p_data)::date,'dia',CASE WHEN v_i.modalidade='correspondencia' THEN 'correspondencia' ELSE v_i.nucleo END,v_i.nucleo_id,v_categoria,v_aluno,v_i.curso_id,v_i.edicao_simposio_id,'Recebimento conferido pela equipe','pagamento') RETURNING id INTO v_lanc;
  INSERT INTO public.recebimentos_its(pessoa_id,inscricao_id,curso_id,edicao_simposio_id,aluno_id,lancamento_id,valor,data_recebimento,mes_caixa,precisao_data,comprovante_url,tipo)
  VALUES(v_i.pessoa_id,v_i.id,v_i.curso_id,v_i.edicao_simposio_id,v_aluno,v_lanc,p_valor,p_data,date_trunc('month',p_data)::date,'dia',coalesce(p_comprovante,v_i.comprovante_url),p_tipo) RETURNING id INTO v_receb;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_atribuicoes) LOOP
    INSERT INTO public.atribuicoes_mensalidade(recebimento_id,aluno_id,competencia,valor) VALUES(v_receb,v_aluno,(v_item->>'competencia')::date,(v_item->>'valor')::numeric);
  END LOOP;
  PERFORM public.registrar_auditoria('recebimento',v_receb,'registrado');
  PERFORM public.marcar_relatorio_para_revisao(p_data);
  RETURN v_receb;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_recebimento_its(UUID,NUMERIC,DATE,TEXT,JSONB,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.registrar_recebimento_its(UUID,NUMERIC,DATE,TEXT,JSONB,TEXT) TO authenticated;

CREATE FUNCTION public.estornar_recebimento_its(p_recebimento_id UUID,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_r public.recebimentos_its%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  SELECT * INTO v_r FROM public.recebimentos_its WHERE id=p_recebimento_id FOR UPDATE;
  IF NOT FOUND OR v_r.status='estornado' THEN RAISE EXCEPTION 'Recebimento indisponivel'; END IF;
  UPDATE public.recebimentos_its SET status='estornado' WHERE id=p_recebimento_id;
  DELETE FROM public.atribuicoes_mensalidade WHERE recebimento_id=p_recebimento_id;
  INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,categoria_id,aluno_id,curso_id,edicao_simposio_id,descricao,origem,estorno_de_id,motivo)
  SELECT 'saida',v_r.valor,current_date,date_trunc('month',current_date)::date,date_trunc('month',current_date)::date,'dia',l.categoria_id,l.aluno_id,l.curso_id,l.edicao_simposio_id,'Estorno de recebimento','estorno',l.id,p_motivo FROM public.lancamentos_financeiros l WHERE l.id=v_r.lancamento_id;
  PERFORM public.registrar_auditoria('recebimento',p_recebimento_id,'estornado: '||p_motivo);
  PERFORM public.marcar_relatorio_para_revisao(current_date);
END; $$;
REVOKE ALL ON FUNCTION public.estornar_recebimento_its(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.estornar_recebimento_its(UUID,TEXT) TO authenticated;

CREATE FUNCTION public.atribuir_mensalidade_its(p_recebimento_id UUID,p_competencia DATE,p_valor NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_r public.recebimentos_its%ROWTYPE; v_id UUID; v_alocado NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_r FROM public.recebimentos_its WHERE id=p_recebimento_id AND status='confirmado' FOR UPDATE;
  IF NOT FOUND OR v_r.aluno_id IS NULL THEN RAISE EXCEPTION 'Recebimento de aluno indisponivel'; END IF;
  IF p_competencia IS NULL OR p_competencia<>date_trunc('month',p_competencia)::date OR p_valor<=0 THEN RAISE EXCEPTION 'Competencia ou valor invalido'; END IF;
  SELECT coalesce(sum(valor),0) INTO v_alocado FROM public.atribuicoes_mensalidade WHERE recebimento_id=p_recebimento_id;
  IF v_alocado+p_valor>v_r.valor THEN RAISE EXCEPTION 'Atribuicoes excedem o recebimento'; END IF;
  INSERT INTO public.atribuicoes_mensalidade(recebimento_id,aluno_id,competencia,valor)
  VALUES(p_recebimento_id,v_r.aluno_id,p_competencia,p_valor) RETURNING id INTO v_id;
  PERFORM public.registrar_auditoria('recebimento',p_recebimento_id,'mensalidade_atribuida',NULL,jsonb_build_object('competencia',p_competencia,'valor',p_valor));
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.atribuir_mensalidade_its(UUID,DATE,NUMERIC) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.atribuir_mensalidade_its(UUID,DATE,NUMERIC) TO authenticated;

CREATE FUNCTION public.retirar_atribuicao_its(p_atribuicao_id UUID,p_motivo TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item public.atribuicoes_mensalidade%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF nullif(trim(p_motivo),'') IS NULL THEN RAISE EXCEPTION 'Informe motivo'; END IF;
  DELETE FROM public.atribuicoes_mensalidade WHERE id=p_atribuicao_id RETURNING * INTO v_item;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuicao nao encontrada'; END IF;
  PERFORM public.registrar_auditoria('recebimento',v_item.recebimento_id,'mensalidade_desvinculada',p_motivo,jsonb_build_object('competencia',v_item.competencia,'valor',v_item.valor));
END; $$;
REVOKE ALL ON FUNCTION public.retirar_atribuicao_its(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.retirar_atribuicao_its(UUID,TEXT) TO authenticated;

CREATE FUNCTION public.validar_aluno_historico(p_aluno_id UUID,p_nome TEXT,p_cpf TEXT,p_situacao TEXT,p_primeira_competencia DATE DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_aluno public.alunos%ROWTYPE; v_cpf TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_aluno FROM public.alunos WHERE id=p_aluno_id AND origem_referencia IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno historico nao encontrado'; END IF;
  IF p_situacao NOT IN ('ativo','pausado','concluido','cancelado') THEN RAISE EXCEPTION 'Situacao invalida'; END IF;
  IF p_situacao='ativo' AND (p_primeira_competencia IS NULL OR p_primeira_competencia<>date_trunc('month',p_primeira_competencia)::date) THEN RAISE EXCEPTION 'Informe primeiro mes do aluno ativo'; END IF;
  v_cpf := nullif(regexp_replace(coalesce(p_cpf,''),'\D','','g'),'');
  IF v_cpf IS NOT NULL AND length(v_cpf)<>11 THEN RAISE EXCEPTION 'CPF invalido'; END IF;
  IF p_situacao='ativo' AND v_cpf IS NULL THEN RAISE EXCEPTION 'Identifique CPF antes de ativar'; END IF;
  IF v_cpf IS NOT NULL AND EXISTS(SELECT 1 FROM public.pessoas WHERE cpf=v_cpf AND id<>v_aluno.pessoa_id) THEN RAISE EXCEPTION 'CPF ja cadastrado; revise possivel duplicidade'; END IF;
  UPDATE public.pessoas SET nome_completo=trim(p_nome),cpf=v_cpf,identidade_pendente=(v_cpf IS NULL) WHERE id=v_aluno.pessoa_id;
  UPDATE public.alunos SET nome=trim(p_nome),situacao=p_situacao,ativo=(p_situacao='ativo'),primeira_competencia=p_primeira_competencia WHERE id=p_aluno_id;
  PERFORM public.registrar_auditoria('aluno',p_aluno_id,'historico_validado');
END; $$;
REVOKE ALL ON FUNCTION public.validar_aluno_historico(UUID,TEXT,TEXT,TEXT,DATE) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.validar_aluno_historico(UUID,TEXT,TEXT,TEXT,DATE) TO authenticated;
