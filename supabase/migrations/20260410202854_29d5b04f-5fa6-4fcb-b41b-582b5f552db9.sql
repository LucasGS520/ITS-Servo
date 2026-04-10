-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can upload comprovante" ON public.inscricoes;

-- New policy: public users can update inscricoes for comprovante upload OR cancellation
CREATE POLICY "Public users can update inscricao status"
ON public.inscricoes
FOR UPDATE
USING (true)
WITH CHECK (
  -- Allow setting status to comprovante_enviado (upload comprovante)
  (status = 'comprovante_enviado')
  OR
  -- Allow setting status to cancelado (cancel pending inscription)
  (status = 'cancelado')
);