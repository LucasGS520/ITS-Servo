/**
 * @its-servo/supabase — camada de dados compartilhada da plataforma.
 *
 * - `createBrowserClient(url, anonKey)` — fábrica do client (cada app passa seu env).
 * - Contrato público de inscrição Site → Central:
 *     solicitarInscricao, consultarInscricoesPublicas, solicitarCancelamentoPublico, enviarComprovante.
 *
 * Regra de ouro: nenhum acesso público fala com a tabela diretamente. Consultas
 * administrativas autenticadas são protegidas por RLS.
 *
 * Os tipos das tabelas e RPCs ficam centralizados em `types.ts`.
 */
export { createBrowserClient, type SupabaseClient } from "./client.ts";
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./types.ts";
export { NUCLEOS, NUCLEO_OPTIONS, NUCLEO_LABELS, type Nucleo } from "./nucleos.ts";
export {
  solicitarInscricao,
  criarInscricao,
  buscarInscricao,
  enviarComprovante,
  consultarInscricoesPublicas,
  solicitarCancelamentoPublico,
  listarDestinosPublicos,
  listarNucleosPublicos,
  type InscricaoDTO,
  type InscricaoResumo,
  type InscricaoPublica,
  type DestinoPublico,
  type NucleoPublico,
} from "./contract.ts";
