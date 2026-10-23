BEGIN;
DO $$
DECLARE v_edicao uuid; v_item uuid; v_curso uuid; v_auditorias int;
BEGIN
  INSERT INTO public.edicoes_simposio(nome,valor,ativo,publico) VALUES('Teste isolado',70,true,false) RETURNING id INTO v_edicao;
  INSERT INTO public.itens_simposio(edicao_id,tipo,descricao,doador,valor,quantidade,unidade_medida,situacao_doacao)
    VALUES(v_edicao,'doacao_bem_servico','Livros','Doador',NULL,2,'unidades','prometida') RETURNING id INTO v_item;
  UPDATE public.itens_simposio SET situacao_doacao='recebida',data_recebimento=current_date WHERE id=v_item;
  SELECT count(*) INTO v_auditorias FROM public.auditoria_operacional WHERE entidade='item_simposio' AND entidade_id=v_item;
  IF v_auditorias<>2 THEN RAISE EXCEPTION 'Doação sem trilha de criação e correção'; END IF;
  BEGIN
    UPDATE public.itens_simposio SET valor=10 WHERE id=v_item;
    RAISE EXCEPTION 'Doação com valor financeiro aceita';
  EXCEPTION WHEN check_violation THEN NULL; END;
  SELECT id INTO v_curso FROM public.cursos WHERE codigo='capacitacao_obreiros';
  UPDATE public.cursos SET publico=false,taxa_matricula=NULL,mensalidade_referencia=NULL WHERE id=v_curso;
  BEGIN
    UPDATE public.cursos SET publico=true WHERE id=v_curso;
    RAISE EXCEPTION 'Curso sem preços foi publicado';
  EXCEPTION WHEN check_violation THEN NULL; END;
  UPDATE public.cursos SET taxa_matricula=40,mensalidade_referencia=150,publico=true WHERE id=v_curso;
  IF NOT EXISTS(SELECT 1 FROM public.cursos WHERE id=v_curso AND publico) THEN RAISE EXCEPTION 'Curso configurado não publicado'; END IF;
END $$;
ROLLBACK;
