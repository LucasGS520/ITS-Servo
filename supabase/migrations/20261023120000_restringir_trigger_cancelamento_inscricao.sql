-- A funcao e executada somente pelo trigger; nenhum cliente precisa chama-la via RPC.
REVOKE ALL ON FUNCTION public.auditar_pedido_cancelamento_inscricao() FROM PUBLIC,anon,authenticated;
