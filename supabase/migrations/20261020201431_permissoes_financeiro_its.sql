-- Recebimentos e atribuições só mudam pelas funções com validação e auditoria.
DROP POLICY IF EXISTS "Admins manage recebimentos ITS" ON public.recebimentos_its;
CREATE POLICY "Admins read recebimentos ITS" ON public.recebimentos_its
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage atribuicoes" ON public.atribuicoes_mensalidade;
CREATE POLICY "Admins read atribuicoes" ON public.atribuicoes_mensalidade
  FOR SELECT TO authenticated USING (public.is_admin());

-- Funções antigas de cobrança e funções de gatilho não são endpoints públicos.
REVOKE EXECUTE ON FUNCTION public.estornar_pagamento(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.recusar_pagamento(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.auditar_cadastro_operacional() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.sincronizar_nucleo_referencia() FROM PUBLIC,anon,authenticated;
