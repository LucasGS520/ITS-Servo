-- Fecha a execucao publica de funcoes auxiliares SECURITY DEFINER.
-- Somente as RPCs abaixo devem ser chamadas pelo frontend.

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_numero_inscricao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.criar_aluno_de_inscricao() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.registrar_auditoria(TEXT, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.marcar_relatorio_para_revisao(DATE) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_inscricao(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancelar_inscricao(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_inscricao(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_inscricao(TEXT, TEXT) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.criar_registro_financeiro(TEXT, NUMERIC, DATE, UUID, TEXT, UUID, TEXT, TEXT, UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.corrigir_registro_financeiro(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.emitir_relatorio_mensal(DATE, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_registro_financeiro(TEXT, NUMERIC, DATE, UUID, TEXT, UUID, TEXT, TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.conciliar_pagamento(UUID, NUMERIC, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.corrigir_registro_financeiro(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.emitir_relatorio_mensal(DATE, JSONB) TO authenticated;

-- Toda nova funcao deve receber grants explicitos na migration que a cria.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
