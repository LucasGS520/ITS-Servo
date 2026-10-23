-- Instituto configura atividades e guarda bens/serviços fora do livro-caixa.
ALTER TABLE public.cursos ADD CONSTRAINT cursos_publicacao_valores_its
  CHECK (NOT publico OR (ativo AND taxa_matricula IS NOT NULL AND mensalidade_referencia IS NOT NULL));

ALTER TABLE public.itens_simposio
  ADD COLUMN quantidade NUMERIC(12,2) CHECK (quantidade IS NULL OR quantidade > 0),
  ADD COLUMN unidade_medida TEXT,
  ADD COLUMN data_recebimento DATE,
  ADD COLUMN situacao_doacao TEXT CHECK (situacao_doacao IN ('prometida','recebida'));

ALTER TABLE public.itens_simposio ADD CONSTRAINT itens_doacao_sem_caixa_its
  CHECK (tipo <> 'doacao_bem_servico' OR valor IS NULL);
ALTER TABLE public.itens_simposio ADD CONSTRAINT itens_doacao_data_its
  CHECK (situacao_doacao IS DISTINCT FROM 'prometida' OR data_recebimento IS NULL);

CREATE OR REPLACE FUNCTION public.auditar_item_simposio_its()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.origem_referencia IS NOT NULL AND
       (NEW.origem_referencia IS DISTINCT FROM OLD.origem_referencia OR NEW.tipo IS DISTINCT FROM OLD.tipo OR NEW.valor IS DISTINCT FROM OLD.valor) THEN
      RAISE EXCEPTION 'A fonte histórica e seu tipo financeiro não podem ser alterados';
    END IF;
    PERFORM public.registrar_auditoria('item_simposio',NEW.id,'corrigido',NULL,
      jsonb_build_object('antes',to_jsonb(OLD),'depois',to_jsonb(NEW)));
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.registrar_auditoria('item_simposio',NEW.id,'criado',NULL,to_jsonb(NEW));
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.auditar_item_simposio_its() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS auditar_item_simposio_its ON public.itens_simposio;
CREATE TRIGGER auditar_item_simposio_its AFTER INSERT OR UPDATE ON public.itens_simposio
  FOR EACH ROW EXECUTE FUNCTION public.auditar_item_simposio_its();

CREATE OR REPLACE FUNCTION public.validar_aluno_historico(
  p_aluno_id UUID, p_nome TEXT, p_cpf TEXT, p_situacao TEXT,
  p_primeira_competencia DATE DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_aluno public.alunos%ROWTYPE; v_cpf TEXT; v_cpf_atual TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_aluno FROM public.alunos WHERE id=p_aluno_id AND origem_referencia IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno historico nao encontrado'; END IF;
  IF nullif(trim(p_nome),'') IS NULL THEN RAISE EXCEPTION 'Informe o nome conferido'; END IF;
  IF p_situacao NOT IN ('ativo','pausado','concluido','cancelado') THEN RAISE EXCEPTION 'Situacao invalida'; END IF;
  IF p_primeira_competencia IS NOT NULL AND p_primeira_competencia<>date_trunc('month',p_primeira_competencia)::date
    THEN RAISE EXCEPTION 'Mes informado deve ser o primeiro dia do mes'; END IF;
  SELECT cpf INTO v_cpf_atual FROM public.pessoas WHERE id=v_aluno.pessoa_id FOR UPDATE;
  v_cpf := coalesce(nullif(regexp_replace(coalesce(p_cpf,''),'\D','','g'),''),v_cpf_atual);
  IF v_cpf IS NOT NULL AND length(v_cpf)<>11 THEN RAISE EXCEPTION 'CPF invalido'; END IF;
  IF p_situacao='ativo' AND v_cpf IS NULL THEN RAISE EXCEPTION 'Identifique CPF antes de ativar'; END IF;
  IF v_cpf IS NOT NULL AND EXISTS(SELECT 1 FROM public.pessoas WHERE cpf=v_cpf AND id<>v_aluno.pessoa_id)
    THEN RAISE EXCEPTION 'CPF ja cadastrado; revise possivel duplicidade'; END IF;
  UPDATE public.pessoas SET nome_completo=trim(p_nome),cpf=v_cpf,identidade_pendente=(v_cpf IS NULL)
    WHERE id=v_aluno.pessoa_id;
  UPDATE public.alunos SET nome=trim(p_nome),situacao=p_situacao,ativo=(p_situacao='ativo'),
    primeira_competencia=coalesce(p_primeira_competencia,v_aluno.primeira_competencia) WHERE id=p_aluno_id;
  PERFORM public.registrar_auditoria('aluno',p_aluno_id,'historico_validado',NULL,
    jsonb_build_object('situacao_anterior',v_aluno.situacao,'situacao_nova',p_situacao));
END; $$;
