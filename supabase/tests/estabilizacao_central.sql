-- Executar somente em ambiente isolado. Todas as fixtures são revertidas.
BEGIN;
DO $$
DECLARE u uuid := gen_random_uuid(); c uuid; i uuid; e uuid; cat uuid; saida uuid;
 op uuid := gen_random_uuid(); m uuid; m2 uuid; d uuid; a uuid; dados jsonb; n bigint;
BEGIN
 INSERT INTO auth.users(id,email) VALUES(u,'teste-central@example.invalid');
 INSERT INTO public.user_roles(user_id,role) VALUES(u,'admin');
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 SELECT id INTO c FROM public.cursos WHERE codigo='teologico';
 UPDATE public.cursos SET taxa_matricula=40,mensalidade_referencia=150,ativo=true WHERE id=c;
 SELECT id INTO cat FROM public.categorias_financeiras WHERE tipo='entrada' AND ativo LIMIT 1;
 SELECT id INTO saida FROM public.categorias_financeiras WHERE tipo='saida' AND ativo LIMIT 1;
 i := public.criar_inscricao_interna('Teste Central','52998224725','11999999999','teste@example.invalid','1990-01-01','medio','presencial','engenho_novo',c,NULL);
 IF (SELECT valor_referencia FROM public.inscricoes WHERE id=i)<>40 THEN RAISE EXCEPTION 'Preço não capturado'; END IF;
 UPDATE public.cursos SET taxa_matricula=60 WHERE id=c;
 IF (SELECT valor_referencia FROM public.inscricoes WHERE id=i)<>40 THEN RAISE EXCEPTION 'Preço mudou retroativamente'; END IF;
 IF (SELECT numero_inscricao FROM public.inscricoes WHERE id=i) IS NULL THEN RAISE EXCEPTION 'Número ausente'; END IF;
 dados := jsonb_build_object('p_id',null,'p_tipo','entrada','p_valor',20,'p_data','2026-10-23','p_mes_caixa','2026-10-01',
 'p_categoria_id',cat,'p_inscricao_id',i,'p_finalidade','matricula');
 m := public.executar_movimento_its(op,'salvar',dados);
 m2 := public.executar_movimento_its(op,'salvar',dados);
 IF m<>m2 THEN RAISE EXCEPTION 'Movimento duplicado'; END IF;
 IF (SELECT status FROM public.inscricoes WHERE id=i)<>'em_analise' THEN RAISE EXCEPTION 'Recebimento confirmou'; END IF;
 SELECT count(*) INTO n FROM public.lancamentos_financeiros;
 PERFORM public.confirmar_inscricao_its(i,NULL,false,NULL);
 IF (SELECT count(*) FROM public.lancamentos_financeiros)<>n THEN RAISE EXCEPTION 'Confirmação alterou caixa'; END IF;
 SELECT id INTO a FROM public.alunos WHERE inscricao_id=i;
 IF a IS NULL THEN RAISE EXCEPTION 'Aluno ausente'; END IF;
 PERFORM public.atualizar_aluno_its(a,'Teste Central','52998224725','11999999999','teste@example.invalid','1990-01-01','medio','ariston','pausado','Teste');
 IF (SELECT unidade FROM public.lancamentos_financeiros WHERE id=m)<>'engenho_novo' THEN RAISE EXCEPTION 'Troca de núcleo reescreveu caixa'; END IF;
 PERFORM public.salvar_isencao_inscricao(i,'mensalidade','2026-11-01','Teste isolado',true);
 PERFORM public.corrigir_preco_inscricao_its(i,0,'Teste de gratuidade');
 IF (SELECT valor_referencia FROM public.inscricoes WHERE id=i)<>0 THEN RAISE EXCEPTION 'Gratuidade não persistiu'; END IF;
 PERFORM public.cancelar_inscricao_interna(i,'Teste de cancelamento');
 IF (SELECT count(*) FROM public.lancamentos_financeiros)<>n THEN RAISE EXCEPTION 'Cancelamento alterou caixa'; END IF;
 op:=gen_random_uuid(); dados:=jsonb_build_object('p_entrada_id',m,'p_valor',5,'p_data','2026-11-01','p_categoria_id',saida,'p_descricao','Teste');
 d:=public.executar_movimento_its(op,'devolver',dados);
 IF d<>public.executar_movimento_its(op,'devolver',dados) THEN RAISE EXCEPTION 'Devolução duplicada'; END IF;
 IF (SELECT unidade FROM public.lancamentos_financeiros WHERE id=d)<>'engenho_novo' THEN RAISE EXCEPTION 'Devolução perdeu núcleo'; END IF;
 BEGIN
  PERFORM public.executar_movimento_its(gen_random_uuid(),'devolver',dados||jsonb_build_object('p_valor',16));
  RAISE EXCEPTION 'LIMITE_NAO_APLICADO';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='LIMITE_NAO_APLICADO' THEN RAISE; END IF;
 END;
 PERFORM public.executar_movimento_its(gen_random_uuid(),'devolver',dados||jsonb_build_object('p_valor',15));
 IF (SELECT sum(valor) FROM public.lancamentos_financeiros WHERE estorno_de_id=m)<>20 THEN RAISE EXCEPTION 'Devolução integral incorreta'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.auditoria_operacional WHERE entidade_id=m) THEN RAISE EXCEPTION 'Auditoria ausente'; END IF;
 -- Uma chave repetida com conteúdo diferente não pode ser aceita.
 BEGIN
  PERFORM public.executar_movimento_its(op,'devolver',dados||jsonb_build_object('p_valor',1));
  RAISE EXCEPTION 'REPETICAO_ALTERADA_ACEITA';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='REPETICAO_ALTERADA_ACEITA' THEN RAISE; END IF;
 END;
 -- Simpósio interno, preço zero, fechamento e resolução de participação existente.
 INSERT INTO public.edicoes_simposio(nome,valor,ativo,publico) VALUES('Edição teste isolado',0,true,false) RETURNING id INTO e;
 i:=public.criar_inscricao_interna('Teste Central','52998224725','11999999999','teste@example.invalid','1990-01-01','medio','presencial','engenho_novo',NULL,e);
 UPDATE public.edicoes_simposio SET ativo=false,publico=false WHERE id=e;
 PERFORM public.confirmar_inscricao_its(i,NULL,false,NULL);
 IF NOT EXISTS(SELECT 1 FROM public.auditoria_operacional audit WHERE entidade_id=i AND audit.dados->>'contexto_financeiro'='gratuita') THEN RAISE EXCEPTION 'Auditoria de gratuidade incorreta'; END IF;
 BEGIN
  PERFORM public.criar_inscricao_interna('Outro Teste','11144477735','11999999999','outro@example.invalid','1990-01-01','medio','presencial','engenho_novo',NULL,e);
  RAISE EXCEPTION 'EDICAO_FECHADA_ACEITA';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='EDICAO_FECHADA_ACEITA' THEN RAISE; END IF;
 END;
 -- Contrato público: o servidor captura o catálogo; o chamador não escolhe preço.
 UPDATE public.cursos SET publico=true,taxa_matricula=40,mensalidade_referencia=150 WHERE id=c;
 SELECT inscricao_id INTO i FROM public.criar_matricula_operacional('Teste público','11144477735','11999999999','publico@example.invalid','1990-01-01','medio','presencial','engenho_novo','curso','teologico',NULL,'hash-local');
 IF (SELECT valor_referencia FROM public.inscricoes WHERE id=i)<>40 THEN RAISE EXCEPTION 'Contrato público sem preço'; END IF;
 IF (SELECT status FROM public.inscricoes WHERE id=i)<>'em_analise' THEN RAISE EXCEPTION 'Contrato público sem análise'; END IF;
 -- Histórico sem dia: corrigir valor preserva origem, precisão e núcleo antigo.
 INSERT INTO public.pessoas(nome_completo,identidade_pendente) VALUES('Histórico teste',true) RETURNING id INTO e;
 INSERT INTO public.alunos(nome,unidade,pessoa_id,curso_id,situacao,origem_referencia,ativo)
 VALUES('Histórico teste','engenho_novo',e,c,'pendente_validacao','teste-local:linha-1',false) RETURNING id INTO a;
 INSERT INTO public.lancamentos_financeiros(tipo,valor,data,competencia,mes_caixa,precisao_data,unidade,categoria_id,aluno_id,curso_id,finalidade,origem,origem_referencia,conciliacao_status)
 VALUES('entrada',150,NULL,'2026-09-01','2026-09-01','mes','engenho_novo',cat,a,c,'mensalidade','legado','teste-local:celula-1','provisorio') RETURNING id INTO m;
 INSERT INTO public.recebimentos_its(pessoa_id,aluno_id,curso_id,lancamento_id,valor,mes_caixa,precisao_data,origem,origem_referencia)
 VALUES(e,a,c,m,150,'2026-09-01','mes','historico','teste-local:celula-1');
 PERFORM public.atualizar_aluno_its(a,'Histórico teste','12345678909','11999999999','hist@example.invalid','1990-01-01','medio','ariston','ativo','Validado local');
 PERFORM public.executar_movimento_its(gen_random_uuid(),'salvar',jsonb_build_object('p_id',m,'p_tipo','entrada','p_valor',140,'p_mes_caixa','2026-09-01','p_categoria_id',cat,'p_aluno_historico_id',a,'p_finalidade','mensalidade'));
 IF (SELECT valor FROM public.recebimentos_its WHERE lancamento_id=m)<>140 THEN RAISE EXCEPTION 'Histórico dessincronizado'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lancamentos_financeiros WHERE id=m AND unidade='engenho_novo' AND origem_referencia='teste-local:celula-1' AND data IS NULL AND precisao_data='mes' AND conciliacao_status='provisorio') THEN RAISE EXCEPTION 'Histórico perdeu metadados'; END IF;
 -- Administrador obrigatório mesmo com UUIDs válidos.
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 BEGIN
  PERFORM public.executar_movimento_its(gen_random_uuid(),'devolver',dados);
  RAISE EXCEPTION 'SEM_ADMIN_ACEITO';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'Acesso negado' THEN RAISE; END IF;
 END;
 IF has_function_privilege('anon','public.executar_movimento_its(uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'RPC pública indevida'; END IF;
 IF has_table_privilege('authenticated','public.operacoes_financeiras_its','INSERT') THEN RAISE EXCEPTION 'Gravação direta indevida'; END IF;
 RAISE NOTICE 'PASS: preço preservado, gratuidade, confirmação independente, aluno, núcleo, isenção, cancelamento, devolução parcial/integral e repetição';
END $$;
ROLLBACK;
