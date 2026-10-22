-- A regra de um mês por entrada vale para registros novos e para edições
-- que transformam uma entrada manual em mensalidade. O histórico importado
-- continua podendo declarar mês desconhecido.
CREATE OR REPLACE FUNCTION public.validar_mes_referencia_movimentacao_its()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.finalidade='mensalidade' AND NEW.mes_referencia IS NULL AND NEW.origem_referencia IS NULL THEN
    RAISE EXCEPTION 'Informe o mes de referencia da mensalidade';
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.validar_mes_referencia_movimentacao_its() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validar_mes_referencia_movimentacao_its
  BEFORE INSERT OR UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.validar_mes_referencia_movimentacao_its();
