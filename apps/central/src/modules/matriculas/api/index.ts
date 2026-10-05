export {
  atualizarStatusInscricao,
  cancelarInscricaoAutosservico,
  consultarInscricao,
  enviarComprovanteInscricao,
  obterUrlComprovante,
  type AtualizarStatusInscricaoInput,
  type Inscricao,
  type InscricaoResumo,
} from "./commands";
export { useAtualizarStatusInscricao } from "./mutations";
export { MATRICULAS_KEY, useMatriculas } from "./useMatriculas";
