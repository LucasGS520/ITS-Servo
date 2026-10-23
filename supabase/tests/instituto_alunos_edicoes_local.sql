BEGIN;
DO $$
DECLARE v_usuario uuid := gen_random_uuid(); v_pessoa uuid; v_aluno uuid; v_outro_aluno uuid; v_curso uuid; v_outro_curso uuid;
  v_nucleo public.nucleos%ROWTYPE; v_edicao uuid; v_inscricao uuid;
BEGIN
  INSERT INTO auth.users(id) VALUES(v_usuario);
  INSERT INTO public.user_roles(user_id,role) VALUES(v_usuario,'admin');
  PERFORM set_config('request.jwt.claim.sub',v_usuario::text,true);
  SELECT id INTO v_curso FROM public.cursos WHERE codigo='teologico';
  SELECT id INTO v_outro_curso FROM public.cursos WHERE codigo='capacitacao_obreiros';
  SELECT * INTO v_nucleo FROM public.nucleos WHERE ativo ORDER BY nome LIMIT 1;
  INSERT INTO public.pessoas(nome_completo,identidade_pendente) VALUES('Aluna Histórica',true) RETURNING id INTO v_pessoa;
  INSERT INTO public.alunos(nome,unidade,nucleo_id,curso_id,pessoa_id,origem_referencia)
    VALUES('Aluna Histórica',v_nucleo.slug,v_nucleo.id,v_curso,v_pessoa,'teste-local:aluna') RETURNING id INTO v_aluno;
  INSERT INTO public.alunos(nome,unidade,nucleo_id,curso_id,pessoa_id,origem_referencia)
    VALUES('Aluna Histórica',v_nucleo.slug,v_nucleo.id,v_outro_curso,v_pessoa,'teste-local:outro-curso') RETURNING id INTO v_outro_aluno;
  PERFORM public.atualizar_aluno_its(v_aluno,'Aluna Confirmada','12345678909','11999999999',
    'teste@example.com',NULL,'medio',v_nucleo.slug,'ativo','Conferida');
  IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE id=v_aluno AND situacao='ativo' AND primeira_competencia IS NULL)
    THEN RAISE EXCEPTION 'Validação criou mês ou não ativou'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE id=v_outro_aluno AND curso_id=v_outro_curso AND nome='Aluna Confirmada')
    THEN RAISE EXCEPTION 'Outro vínculo acadêmico alterado ou nome desatualizado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.auditoria_operacional WHERE entidade='aluno' AND entidade_id=v_aluno AND acao='dados_academicos_atualizados')
    THEN RAISE EXCEPTION 'Sem auditoria acadêmica'; END IF;
  INSERT INTO public.edicoes_simposio(nome,valor,ativo,publico) VALUES('Teste de edição',70,true,false) RETURNING id INTO v_edicao;
  v_inscricao := public.criar_inscricao_interna('Participante Teste','98765432100','11999999999',
    'evento@example.com','1990-01-01','medio','correspondencia',NULL,NULL,v_edicao);
  IF v_inscricao IS NULL THEN RAISE EXCEPTION 'Inscrição interna ativa não criada'; END IF;
  UPDATE public.edicoes_simposio SET ativo=false,publico=false WHERE id=v_edicao;
  BEGIN
    PERFORM public.criar_inscricao_interna('Outra Pessoa','11144477735','11999999999',
      'outra@example.com','1990-01-01','medio','correspondencia',NULL,NULL,v_edicao);
    RAISE EXCEPTION 'Edição encerrada aceitou nova inscrição';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM='Edição encerrada aceitou nova inscrição' THEN RAISE; END IF;
  END;
  IF NOT EXISTS(SELECT 1 FROM public.inscricoes WHERE id=v_inscricao AND status='em_analise')
    THEN RAISE EXCEPTION 'Encerramento alterou inscrição existente'; END IF;
END $$;
ROLLBACK;
