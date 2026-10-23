import type { Inscricao } from "@/modules/matriculas/api";
import type { Lancamento } from "@/modules/financeiro/api";
import type { IsencaoInscricao } from "@/modules/matriculas/api/useFichaInscricao";

export const nomeAtividade = (inscricao: Inscricao, cursos: { id: string; nome: string }[], edicoes: { id: string; nome: string }[]) =>
  inscricao.curso_id ? cursos.find((item) => item.id === inscricao.curso_id)?.nome ?? "Curso não encontrado"
    : edicoes.find((item) => item.id === inscricao.edicao_simposio_id)?.nome ?? "Edição não encontrada";

export const recebidoLiquido = (movimentos: Lancamento[], finalidade?: string, mes?: string) => {
  const entradas = movimentos.filter((item) => item.tipo === "entrada" && !item.estorno_de_id &&
    (!finalidade || item.finalidade === finalidade) && (!mes || item.mes_referencia?.slice(0, 7) === mes));
  const ids = new Set(entradas.map((item) => item.id));
  const recebido = entradas.reduce((s, item) => s + Number(item.valor), 0);
  const devolvido = movimentos.filter((item) => item.tipo === "saida" && item.estorno_de_id && ids.has(item.estorno_de_id))
    .reduce((s, item) => s + Number(item.valor), 0);
  return recebido - devolvido;
};

export const situacaoFinanceira = (inscricao: Inscricao, movimentos: Lancamento[], valor: number | null, isencoes: IsencaoInscricao[] = []) => {
  const finalidade = inscricao.destino === "simposio" ? "inscricao_evento" : "matricula";
  if (isencoes.some((item) => item.ativo && item.finalidade === finalidade)) return "Isenta";
  if (inscricao.isento) return "Isenção antiga · revisar alcance";
  const recebido = recebidoLiquido(movimentos, finalidade);
  if (valor == null || valor <= 0) return recebido > 0 ? "Recebimento com valor não configurado" : "Valor não configurado";
  if (recebido <= 0) return inscricao.comprovante_url ? "Comprovante a conferir · sem recebimento" : "Sem recebimento";
  if (recebido < valor) return "Recebido parcialmente";
  return "Valor recebido";
};
