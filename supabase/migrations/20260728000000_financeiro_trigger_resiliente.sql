-- ============================================================================
-- FIX: criar_aluno_de_inscricao não pode ABORTAR a confirmação do admin.
--
-- Antes: inscrição presencial com nucleo NULL ou fora da lista de unidades
-- (ex.: inscrições legadas com 'maputo') violava o CHECK de alunos.unidade e
-- revertia o UPDATE de status='confirmada' com erro opaco no painel.
--
-- Agora: unidade inválida → WARNING no log e a confirmação segue; o aluno pode
-- ser cadastrado manualmente na tab Alunos do financeiro.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.criar_aluno_de_inscricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unidade TEXT;
BEGIN
  IF NEW.status = 'confirmada' AND OLD.status IS DISTINCT FROM 'confirmada' THEN
    v_unidade := CASE
      WHEN NEW.modalidade = 'correspondencia' THEN 'correspondencia'
      ELSE NEW.nucleo
    END;

    IF v_unidade IS NULL OR v_unidade NOT IN (
      'sede_jd_santa_monica','engenho_novo','jd_conceicao','ariston','correspondencia'
    ) THEN
      RAISE WARNING
        'criar_aluno_de_inscricao: unidade inválida (%) na inscrição % — aluno NÃO criado; cadastre manualmente no financeiro.',
        COALESCE(v_unidade, 'NULL'), NEW.numero_inscricao;
      RETURN NEW;
    END IF;

    INSERT INTO public.alunos (nome, unidade, inscricao_id)
    VALUES (NEW.nome_completo, v_unidade, NEW.id)
    ON CONFLICT (inscricao_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
