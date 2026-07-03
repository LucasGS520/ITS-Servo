/**
 * @its-servo/supabase — camada de dados compartilhada da plataforma.
 *
 * Esqueleto (Fase 1). Será populado na Fase 2 com:
 *  - `client.ts`  — client Supabase tipado (migrado de apps/central/src/integrations/supabase)
 *  - `types.ts`   — tipos gerados do banco
 *  - `contract.ts` — wrappers tipados do CONTRATO (as chamadas às RPC/edge):
 *      criarInscricao(dto) → { numero_inscricao, token }
 *      buscarInscricao(numero, token)
 *      enviarComprovante(numero, token, arquivo)
 *      cancelarInscricao(numero, token)
 *
 * Regra de ouro: nenhum app fala com a tabela `inscricoes` diretamente — só por
 * aqui. Ver docs/arquitetura.md §5 (Contrato de Inscrição).
 */
export {};
