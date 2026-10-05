-- Núcleos passam a ser configuráveis e deixam de depender de listas duplicadas.
CREATE TABLE IF NOT EXISTS public.nucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_]+$'),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL CHECK (char_length(uf) = 2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.nucleos (slug, nome, cidade, uf) VALUES
  ('sede_jd_santa_monica', 'Sede Jd. Santa Mônica', 'Barueri', 'SP'),
  ('engenho_novo', 'Engenho Novo', 'Barueri', 'SP'),
  ('jd_conceicao', 'Jd. Conceição', 'Osasco', 'SP'),
  ('ariston', 'Ariston', 'Carapicuíba', 'SP')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.nucleos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nucleos" ON public.nucleos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public reads active nucleos" ON public.nucleos FOR SELECT TO anon, authenticated
  USING (ativo);

ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS nucleo_id UUID REFERENCES public.nucleos(id);
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS nucleo_id UUID REFERENCES public.nucleos(id);
ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS nucleo_id UUID REFERENCES public.nucleos(id);

UPDATE public.inscricoes i SET nucleo_id = n.id FROM public.nucleos n
WHERE i.nucleo = n.slug AND i.nucleo_id IS NULL;
UPDATE public.alunos a SET nucleo_id = n.id FROM public.nucleos n
WHERE a.unidade = n.slug AND a.nucleo_id IS NULL;
UPDATE public.lancamentos_financeiros l SET nucleo_id = n.id FROM public.nucleos n
WHERE l.unidade = n.slug AND l.nucleo_id IS NULL;

CREATE OR REPLACE FUNCTION public.sincronizar_nucleo_referencia()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.nucleo IS NOT NULL AND NEW.nucleo_id IS NULL THEN
    SELECT id INTO NEW.nucleo_id FROM public.nucleos WHERE slug = NEW.nucleo;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sincronizar_nucleo_inscricao ON public.inscricoes;
CREATE TRIGGER sincronizar_nucleo_inscricao BEFORE INSERT OR UPDATE OF nucleo, nucleo_id ON public.inscricoes
FOR EACH ROW EXECUTE FUNCTION public.sincronizar_nucleo_referencia();

-- Libera núcleos futuros, mantendo "correspondencia" como modalidade sem núcleo físico.
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_unidade_check;

CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_teologico UUID; v_nucleo UUID;
BEGIN
  IF OLD.status = 'confirmada' AND NEW.status IS DISTINCT FROM 'confirmada' THEN
    UPDATE public.alunos SET ativo = false WHERE inscricao_id = NEW.id;
  END IF;
  IF NEW.status = 'confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' THEN
    SELECT id INTO v_teologico FROM public.cursos WHERE codigo = 'teologico';
    IF NEW.destino <> 'curso' OR NEW.curso_id IS DISTINCT FROM v_teologico THEN RETURN NEW; END IF;
    IF NEW.modalidade = 'presencial' THEN
      SELECT id INTO v_nucleo FROM public.nucleos WHERE id = NEW.nucleo_id AND ativo;
      IF v_nucleo IS NULL THEN RAISE EXCEPTION 'A matrícula confirmada precisa de um núcleo ativo'; END IF;
    END IF;
    INSERT INTO public.alunos (nome, unidade, nucleo_id, inscricao_id, ativo)
    VALUES (NEW.nome_completo, CASE WHEN NEW.modalidade = 'correspondencia' THEN 'correspondencia' ELSE NEW.nucleo END, v_nucleo, NEW.id, true)
    ON CONFLICT (inscricao_id) DO UPDATE SET nome = EXCLUDED.nome, unidade = EXCLUDED.unidade, nucleo_id = EXCLUDED.nucleo_id, ativo = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_atendimento(
  p_inscricao_id UUID, p_nome_completo TEXT, p_telefone TEXT, p_email TEXT,
  p_data_nascimento DATE, p_escolaridade TEXT, p_motivo TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inscricao public.inscricoes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  SELECT * INTO v_inscricao FROM public.inscricoes WHERE id = p_inscricao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inscrição não encontrada'; END IF;
  IF v_inscricao.status IN ('confirmada', 'cancelado') THEN RAISE EXCEPTION 'Registros finalizados não podem ser corrigidos por Atendimento'; END IF;
  UPDATE public.pessoas SET nome_completo = trim(p_nome_completo), telefone = p_telefone, email = trim(p_email), data_nascimento = p_data_nascimento, escolaridade = p_escolaridade WHERE id = v_inscricao.pessoa_id;
  UPDATE public.inscricoes SET nome_completo = trim(p_nome_completo), telefone = p_telefone, email = trim(p_email), data_nascimento = p_data_nascimento, escolaridade = p_escolaridade WHERE id = p_inscricao_id;
  PERFORM public.registrar_auditoria('matricula', p_inscricao_id, 'dados_atualizados', NULLIF(trim(p_motivo), ''), '{}'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.atualizar_atendimento(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atualizar_atendimento(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT) TO authenticated;
