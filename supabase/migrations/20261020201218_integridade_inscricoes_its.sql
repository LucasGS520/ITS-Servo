-- Uma pessoa pode participar de atividades distintas, mas somente uma inscrição
-- não cancelada por curso ou por edição de evento.
CREATE UNIQUE INDEX IF NOT EXISTS inscricoes_pessoa_curso_aberta_its
  ON public.inscricoes(pessoa_id, curso_id)
  WHERE curso_id IS NOT NULL AND status <> 'cancelado';

CREATE UNIQUE INDEX IF NOT EXISTS inscricoes_pessoa_edicao_aberta_its
  ON public.inscricoes(pessoa_id, edicao_simposio_id)
  WHERE edicao_simposio_id IS NOT NULL AND status <> 'cancelado';

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
  IF p_situacao='ativo' AND (p_primeira_competencia IS NULL OR p_primeira_competencia<>date_trunc('month',p_primeira_competencia)::date)
    THEN RAISE EXCEPTION 'Informe primeiro mes do aluno ativo'; END IF;
  SELECT cpf INTO v_cpf_atual FROM public.pessoas WHERE id=v_aluno.pessoa_id FOR UPDATE;
  v_cpf := coalesce(nullif(regexp_replace(coalesce(p_cpf,''),'\D','','g'),''),v_cpf_atual);
  IF v_cpf IS NOT NULL AND length(v_cpf)<>11 THEN RAISE EXCEPTION 'CPF invalido'; END IF;
  IF p_situacao='ativo' AND v_cpf IS NULL THEN RAISE EXCEPTION 'Identifique CPF antes de ativar'; END IF;
  IF v_cpf IS NOT NULL AND EXISTS(SELECT 1 FROM public.pessoas WHERE cpf=v_cpf AND id<>v_aluno.pessoa_id)
    THEN RAISE EXCEPTION 'CPF ja cadastrado; revise possivel duplicidade'; END IF;
  UPDATE public.pessoas SET nome_completo=trim(p_nome),cpf=v_cpf,identidade_pendente=(v_cpf IS NULL)
    WHERE id=v_aluno.pessoa_id;
  UPDATE public.alunos SET nome=trim(p_nome),situacao=p_situacao,ativo=(p_situacao='ativo'),primeira_competencia=p_primeira_competencia
    WHERE id=p_aluno_id;
  PERFORM public.registrar_auditoria('aluno',p_aluno_id,'historico_validado');
END; $$;
