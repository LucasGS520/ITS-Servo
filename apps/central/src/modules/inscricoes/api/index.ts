export {
  atualizarStatusInscricao,
  cancelarInscricaoAutosservico,
  consultarInscricao,
  enviarComprovanteInscricao,
  obterUrlComprovante,
  type AtualizarStatusInscricaoInput,
  type AtualizarStatusInscricaoResult,
  type Inscricao,
  type InscricaoResumo,
} from "./commands";
export { useAtualizarStatusInscricao } from "./mutations";
export { INSCRICOES_KEY, useInscricoes } from "./useInscricoes";
