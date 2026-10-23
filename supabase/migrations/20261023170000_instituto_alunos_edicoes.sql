-- O vínculo acadêmico tem edição própria; a participação continua em Inscrições.
ALTER TABLE public.edicoes_simposio ADD CONSTRAINT edicao_publicada_aberta_its
  CHECK (NOT publico OR (ativo AND valor IS NOT NULL));
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_unidade_check;
ALTER TABLE public.alunos ADD CONSTRAINT alunos_unidade_preenchida_its CHECK (nullif(trim(unidade),'') IS NOT NULL);

CREATE OR REPLACE FUNCTION public.atualizar_aluno_its(
  p_aluno_id uuid, p_nome text, p_cpf text, p_telefone text, p_email text,
  p_nascimento date, p_escolaridade text, p_unidade text, p_situacao text, p_observacoes text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_aluno public.alunos%ROWTYPE; v_pessoa public.pessoas%ROWTYPE;
  v_cpf text; v_nucleo uuid; v_unidade text; v_antes jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO v_aluno FROM public.alunos WHERE id=p_aluno_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado'; END IF;
  IF v_aluno.pessoa_id IS NULL THEN RAISE EXCEPTION 'Aluno sem pessoa vinculada'; END IF;
  SELECT * INTO v_pessoa FROM public.pessoas WHERE id=v_aluno.pessoa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pessoa não encontrada'; END IF;
  IF nullif(trim(p_nome),'') IS NULL THEN RAISE EXCEPTION 'Informe o nome'; END IF;
  IF p_situacao NOT IN ('pendente_validacao','ativo','pausado','concluido','cancelado') THEN RAISE EXCEPTION 'Situação inválida'; END IF;
  IF p_situacao='pendente_validacao' AND v_aluno.situacao<>'pendente_validacao' THEN RAISE EXCEPTION 'Não é possível voltar para pendente'; END IF;
  IF v_aluno.inscricao_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.inscricoes WHERE id=v_aluno.inscricao_id AND status='confirmada') THEN
      IF p_situacao<>'cancelado' THEN RAISE EXCEPTION 'A inscrição cancelada não pode ser reativada aqui'; END IF;
    ELSIF p_situacao='cancelado' THEN RAISE EXCEPTION 'Cancele a participação em Inscrições'; END IF;
  END IF;
  IF v_aluno.origem_referencia IS NOT NULL AND v_aluno.situacao='pendente_validacao' AND p_situacao='cancelado' THEN
    RAISE EXCEPTION 'Valide o histórico antes de marcar cancelamento'; END IF;
  v_cpf := coalesce(nullif(regexp_replace(coalesce(p_cpf,''),'\D','','g'),''),v_pessoa.cpf);
  IF v_cpf IS NOT NULL AND length(v_cpf)<>11 THEN RAISE EXCEPTION 'CPF inválido'; END IF;
  IF p_situacao='ativo' AND v_cpf IS NULL THEN RAISE EXCEPTION 'Informe CPF antes de ativar'; END IF;
  IF v_cpf IS NOT NULL AND EXISTS(SELECT 1 FROM public.pessoas WHERE cpf=v_cpf AND id<>v_pessoa.id) THEN
    RAISE EXCEPTION 'CPF já cadastrado; revise possível duplicidade'; END IF;
  v_unidade := nullif(trim(p_unidade),'');
  IF v_unidade='correspondencia' THEN v_nucleo := NULL;
  ELSE
    SELECT id INTO v_nucleo FROM public.nucleos WHERE slug=v_unidade AND (ativo OR id=v_aluno.nucleo_id);
    IF v_nucleo IS NULL THEN RAISE EXCEPTION 'Selecione um núcleo ativo'; END IF;
  END IF;
  IF v_unidade IS NULL THEN RAISE EXCEPTION 'Informe a unidade'; END IF;
  v_antes := jsonb_build_object('aluno',to_jsonb(v_aluno),'pessoa',to_jsonb(v_pessoa));
  UPDATE public.pessoas SET nome_completo=trim(p_nome),cpf=v_cpf,telefone=nullif(trim(p_telefone),''),
    email=nullif(trim(p_email),''),data_nascimento=p_nascimento,escolaridade=nullif(trim(p_escolaridade),''),
    identidade_pendente=(v_cpf IS NULL) WHERE id=v_pessoa.id;
  UPDATE public.alunos SET nome=trim(p_nome),unidade=v_unidade,nucleo_id=v_nucleo,situacao=p_situacao,
    ativo=(p_situacao='ativo'),observacoes=nullif(trim(p_observacoes),'') WHERE id=p_aluno_id;
  -- A inscrição mantém o núcleo da inscrição original. Contato/identidade corrigidos
  -- são propagados para evitar nomes e CPF divergentes na ficha operacional.
  UPDATE public.inscricoes SET nome_completo=trim(p_nome),cpf=v_cpf,
    telefone=coalesce(nullif(trim(p_telefone),''),telefone),
    email=coalesce(nullif(trim(p_email),''),email)
    WHERE pessoa_id=v_pessoa.id AND v_cpf IS NOT NULL;
  UPDATE public.alunos SET nome=trim(p_nome) WHERE pessoa_id=v_pessoa.id AND id<>p_aluno_id;
  PERFORM public.registrar_auditoria('aluno',p_aluno_id,'dados_academicos_atualizados',NULL,
    jsonb_build_object('antes',v_antes,'depois',jsonb_build_object(
      'aluno',(SELECT to_jsonb(a) FROM public.alunos a WHERE id=p_aluno_id),
      'pessoa',(SELECT to_jsonb(p) FROM public.pessoas p WHERE id=v_pessoa.id))));
END; $$;
REVOKE ALL ON FUNCTION public.atualizar_aluno_its(uuid,text,text,text,text,date,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.atualizar_aluno_its(uuid,text,text,text,text,date,text,text,text,text) TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.alunos FROM authenticated;

CREATE OR REPLACE FUNCTION public.validar_atividade_inscricao_its()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.curso_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.cursos WHERE id=NEW.curso_id AND ativo) THEN
    RAISE EXCEPTION 'Curso não está ativo para novas inscrições';
  END IF;
  IF NEW.edicao_simposio_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.edicoes_simposio WHERE id=NEW.edicao_simposio_id AND ativo) THEN
    RAISE EXCEPTION 'Edição encerrada para novas inscrições';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validar_atividade_inscricao_its() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS validar_atividade_inscricao_its ON public.inscricoes;
CREATE TRIGGER validar_atividade_inscricao_its BEFORE INSERT ON public.inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_atividade_inscricao_its();
