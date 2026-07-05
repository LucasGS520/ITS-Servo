-- =====================================================================
-- Fase 2 — Segurança + Contrato de Inscrição
-- Fecha o acesso anônimo direto à tabela `inscricoes` e o substitui por um
-- contrato baseado em token de posse (RPCs SECURITY DEFINER para leitura/
-- cancelamento; criação/comprovante via edge function com service_role).
-- Corrige riscos: P1 (enumeração de PII), P2 (adulteração), P3 (bucket
-- público), P5 (drift do CHECK de status). Ver docs/arquitetura.md §5.
--
-- IMPORTANTE (sequenciamento): só aplicar em produção JUNTO com o rewiring do
-- client (Fase 3) e o deploy das edge functions — senão o fluxo de inscrição
-- atual (insert/select anônimo) para de funcionar.
-- =====================================================================

-- pgcrypto para hash sha256 do token de autosserviço
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- 1) Coluna do token de autosserviço (armazena apenas o HASH, nunca o token)
-- ---------------------------------------------------------------------
ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS consulta_token_hash TEXT;

-- ---------------------------------------------------------------------
-- 2) Corrige o CHECK de status para incluir 'cancelado' (drift — P5)
-- ---------------------------------------------------------------------
ALTER TABLE public.inscricoes DROP CONSTRAINT IF EXISTS inscricoes_status_check;
ALTER TABLE public.inscricoes
  ADD CONSTRAINT inscricoes_status_check CHECK (
    status IN (
      'aguardando_pagamento',
      'comprovante_enviado',
      'confirmada',
      'pagamento_nao_identificado',
      'cancelado'
    )
  );

-- ---------------------------------------------------------------------
-- 3) Remove as políticas públicas perigosas (USING(true)) — P1, P2
--    As políticas de admin (is_admin) permanecem intactas.
--    Criação passa a ser exclusivamente via edge (service_role).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create inscricao"            ON public.inscricoes;
DROP POLICY IF EXISTS "Anyone can read own inscricao by numero" ON public.inscricoes;
DROP POLICY IF EXISTS "Public users can update inscricao status" ON public.inscricoes;

-- ---------------------------------------------------------------------
-- 4) Bucket de comprovantes -> PRIVADO (P3)
--    Upload/download público passam a ocorrer via edge + signed URLs.
-- ---------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'comprovantes';
DROP POLICY IF EXISTS "Anyone can upload comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view comprovantes"   ON storage.objects;
-- (a política "Admins can delete comprovantes" permanece)

-- Admin precisa LER os objetos para gerar signed URLs no painel (o upload
-- público/anon é feito via edge com service_role, que ignora RLS).
CREATE POLICY "Admins can view comprovantes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes' AND public.is_admin());

-- ---------------------------------------------------------------------
-- 5) Helper interno: valida token de posse de uma inscrição
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inscricao_token_valido(p_numero TEXT, p_token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inscricoes
    WHERE numero_inscricao = p_numero
      AND consulta_token_hash IS NOT NULL
      AND consulta_token_hash = encode(digest(p_token, 'sha256'), 'hex')
  )
$$;

-- ---------------------------------------------------------------------
-- 6) RPC de LEITURA (autosserviço) — retorna os dados do próprio dono
--    somente mediante token válido. Substitui o SELECT anônimo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buscar_inscricao(p_numero TEXT, p_token TEXT)
RETURNS TABLE (
  numero_inscricao TEXT,
  nome_completo    TEXT,
  email            TEXT,
  telefone         TEXT,
  cpf              TEXT,
  data_nascimento  DATE,
  escolaridade     TEXT,
  modalidade       TEXT,
  nucleo           TEXT,
  status           TEXT,
  comprovante_url  TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT numero_inscricao, nome_completo, email, telefone, cpf, data_nascimento,
         escolaridade, modalidade, nucleo, status, comprovante_url, created_at
  FROM public.inscricoes
  WHERE numero_inscricao = p_numero
    AND consulta_token_hash = encode(digest(p_token, 'sha256'), 'hex')
$$;

-- ---------------------------------------------------------------------
-- 7) RPC de CANCELAMENTO (autosserviço) — só com token válido e pendente
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancelar_inscricao(p_numero TEXT, p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE public.inscricoes
     SET status = 'cancelado'
   WHERE numero_inscricao = p_numero
     AND consulta_token_hash = encode(digest(p_token, 'sha256'), 'hex')
     AND status = 'aguardando_pagamento';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- ---------------------------------------------------------------------
-- 8) Permissões de execução (contrato exposto ao anon)
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.inscricao_token_valido(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.buscar_inscricao(TEXT, TEXT)       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancelar_inscricao(TEXT, TEXT)     FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.buscar_inscricao(TEXT, TEXT)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_inscricao(TEXT, TEXT) TO anon, authenticated;
-- inscricao_token_valido permanece de uso interno (não concedida ao anon)
