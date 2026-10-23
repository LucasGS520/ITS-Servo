-- Executar somente em um PostgreSQL local descartavel com as migracoes aplicadas.
-- O stub local de auth.users aceita insercao apenas do id; a base ativa nao e usada.
BEGIN;
INSERT INTO auth.users(id) VALUES ('11111111-1111-4111-8111-111111111111');
INSERT INTO public.user_roles(user_id,role) VALUES ('11111111-1111-4111-8111-111111111111','admin');
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

SELECT public.criar_inscricao_interna('Teste Inscricoes ITS','12345678909','11999999999','teste@example.com',
  DATE '1990-01-01','medio','correspondencia',NULL,
  (SELECT id FROM public.cursos WHERE codigo='teologico'),NULL) AS inscricao_id \gset
SELECT set_config('test.inscricao_id',:'inscricao_id',true);

SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT public.registrar_comprovante_publico_its(
  (SELECT numero_inscricao FROM public.inscricoes WHERE id=:'inscricao_id'::uuid),'teste/comprovante.pdf');
SELECT set_config('request.jwt.claim.role','authenticated',true);

SELECT public.salvar_isencao_inscricao(:'inscricao_id'::uuid,'mensalidade',DATE '2026-10-01','Decisao da equipe',true);
SELECT public.confirmar_inscricao_its(:'inscricao_id'::uuid,NULL,false,NULL);
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT public.registrar_comprovante_publico_its(
  (SELECT numero_inscricao FROM public.inscricoes WHERE id=:'inscricao_id'::uuid),'teste/comprovante-confirmado.pdf');
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE inscricao_id=current_setting('test.inscricao_id')::uuid AND situacao='ativo' AND primeira_competencia IS NULL) THEN
    RAISE EXCEPTION 'Confirmacao sem primeiro mes nao criou aluno ativo';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.auditoria_operacional WHERE entidade='matricula' AND entidade_id=current_setting('test.inscricao_id')::uuid
      AND acao='confirmada_pela_equipe' AND dados->>'contexto_financeiro'='sem_recebimento') THEN
    RAISE EXCEPTION 'Contexto financeiro automatico ausente';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.inscricoes WHERE id=current_setting('test.inscricao_id')::uuid AND status='confirmada') THEN
    RAISE EXCEPTION 'Comprovante posterior rebaixou inscricao confirmada';
  END IF;
END $$;

INSERT INTO public.solicitacoes_cancelamento_inscricao(inscricao_id) VALUES (:'inscricao_id'::uuid);
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.auditoria_operacional WHERE entidade='matricula'
    AND entidade_id=current_setting('test.inscricao_id')::uuid AND acao='cancelamento_solicitado_publicamente') THEN
    RAISE EXCEPTION 'Pedido sem auditoria automatica';
  END IF;
END $$;
SELECT public.resolver_cancelamento_inscricao(
  (SELECT id FROM public.solicitacoes_cancelamento_inscricao WHERE inscricao_id=:'inscricao_id'::uuid AND status='pendente'),
  false,'Participacao mantida');
INSERT INTO public.solicitacoes_cancelamento_inscricao(inscricao_id) VALUES (:'inscricao_id'::uuid);
SELECT public.resolver_cancelamento_inscricao(
  (SELECT id FROM public.solicitacoes_cancelamento_inscricao WHERE inscricao_id=:'inscricao_id'::uuid AND status='pendente'),
  true,'Cancelamento conferido');
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.inscricoes WHERE id=current_setting('test.inscricao_id')::uuid AND status='cancelado') THEN
    RAISE EXCEPTION 'Inscricao nao cancelada';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.alunos WHERE inscricao_id=current_setting('test.inscricao_id')::uuid AND situacao='cancelado') THEN
    RAISE EXCEPTION 'Aluno nao desativado';
  END IF;
END $$;
ROLLBACK;
