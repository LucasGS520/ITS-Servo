-- Cabeçalho dos relatórios gerados sob demanda. Os relatórios antigos permanecem preservados.
CREATE TABLE public.configuracao_relatorios (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  endereco TEXT NOT NULL CHECK (length(trim(endereco)) BETWEEN 5 AND 240),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID
);

INSERT INTO public.configuracao_relatorios (id, endereco)
VALUES (TRUE, 'Rua Via Taboão, 607 – Jardim Santa Mônica – Barueri – SP');

ALTER TABLE public.configuracao_relatorios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.configuracao_relatorios FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.configuracao_relatorios TO authenticated;
CREATE POLICY "Administradores consultam cabecalho" ON public.configuracao_relatorios
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE FUNCTION public.obter_endereco_relatorios()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  RETURN (SELECT endereco FROM public.configuracao_relatorios WHERE id = TRUE);
END;
$$;

CREATE FUNCTION public.atualizar_endereco_relatorios(p_endereco TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_anterior TEXT; v_novo TEXT := trim(p_endereco);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF v_novo IS NULL OR length(v_novo) NOT BETWEEN 5 AND 240 THEN
    RAISE EXCEPTION 'Informe um endereço entre 5 e 240 caracteres';
  END IF;
  SELECT endereco INTO v_anterior FROM public.configuracao_relatorios WHERE id = TRUE FOR UPDATE;
  UPDATE public.configuracao_relatorios
    SET endereco = v_novo, atualizado_em = now(), atualizado_por = auth.uid()
    WHERE id = TRUE;
  IF v_anterior IS DISTINCT FROM v_novo THEN
    PERFORM public.registrar_auditoria('configuracao_relatorios', '00000000-0000-0000-0000-000000000001'::uuid, 'endereco_alterado', NULL,
      jsonb_build_object('anterior', v_anterior, 'novo', v_novo));
  END IF;
  RETURN v_novo;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.obter_endereco_relatorios() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.atualizar_endereco_relatorios(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_endereco_relatorios() TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_endereco_relatorios(TEXT) TO authenticated;
