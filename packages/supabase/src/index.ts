/**
 * @its-servo/supabase — camada de dados compartilhada da plataforma.
 *
 * - `createBrowserClient(url, anonKey)` — fábrica do client (cada app passa seu env).
 * - Contrato de inscrição (único acesso à tabela `inscricoes`):
 *     criarInscricao, buscarInscricao, cancelarInscricao, enviarComprovante.
 *
 * Regra de ouro: nenhum app fala com a tabela diretamente. Ver docs/arquitetura.md §5.
 *
 * TODO (pós-migração): regenerar tipos do banco (supabase gen types) para tipar
 * as RPCs/tabelas de ponta a ponta e substituir os tipos manuais de `contract.ts`.
 */
export { createBrowserClient, type SupabaseClient } from "./client.ts";
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./types.ts";
export { NUCLEOS, NUCLEO_OPTIONS, NUCLEO_LABELS, type Nucleo } from "./nucleos.ts";
export {
  criarInscricao,
  buscarInscricao,
  cancelarInscricao,
  enviarComprovante,
  type InscricaoDTO,
  type InscricaoResumo,
} from "./contract.ts";
