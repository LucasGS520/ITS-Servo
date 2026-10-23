-- Relatórios passam a ser gerados sob demanda. Mantemos os documentos antigos para consulta histórica.
REVOKE EXECUTE ON FUNCTION public.emitir_relatorio_mensal(DATE, JSONB) FROM PUBLIC, anon, authenticated;

-- As operações financeiras ainda chamam esta função. Ela deixa de criar versões automaticamente.
CREATE OR REPLACE FUNCTION public.marcar_relatorio_para_revisao(p_data DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN;
END;
$$;

DROP POLICY IF EXISTS "Admins manage relatorios mensais" ON public.relatorios_mensais_versoes;
CREATE POLICY "Admins read relatorios antigos" ON public.relatorios_mensais_versoes
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.relatorios_mensais_versoes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.relatorios_mensais_versoes TO authenticated;
