import type { Lancamento } from "@/service/financeiro/hooks/useFinanceiro";

/**
 * Agregações puras sobre lançamentos (pensadas para useMemo).
 * Competência é sempre "yyyy-mm-01"; comparações lexicográficas funcionam.
 */

/** Arredonda para centavos — somas encadeadas em float acumulam resíduo binário. */
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const sinal = (l: Lancamento) =>
  l.tipo === "entrada" ? Number(l.valor) : -Number(l.valor);

/** "2026-07" (input type=month) → "2026-07-01" (coluna competencia) */
export const mesParaCompetencia = (mes: string) => `${mes}-01`;

/** "2026-07-01" → "2026-07" */
export const competenciaParaMes = (c: string) => c.slice(0, 7);

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-07-01" → "jul/2026" */
export const formatCompetencia = (c: string) =>
  `${MESES_CURTOS[Number(c.slice(5, 7)) - 1]}/${c.slice(0, 4)}`;

/** "2026-07-15" → "15/07/2026" (T12:00 evita deslocamento de fuso) */
export const formatData = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

export interface TotaisMes {
  entrada: number;
  saida: number;
  saldo: number;
}

/** Totais de um mês (opcionalmente restritos a uma unidade; null = geral). */
export function totaisDoMes(
  lancs: Lancamento[],
  competencia: string,
  unidade?: string | null,
): TotaisMes {
  let entrada = 0;
  let saida = 0;
  for (const l of lancs) {
    if (l.competencia !== competencia) continue;
    if (unidade !== undefined && l.unidade !== unidade) continue;
    if (l.tipo === "entrada") entrada += Number(l.valor);
    else saida += Number(l.valor);
  }
  return { entrada: round2(entrada), saida: round2(saida), saldo: round2(entrada - saida) };
}

/** Saldo de tudo ANTES da competência (o "SALDO ANTERIOR" da planilha). */
export const saldoAnterior = (lancs: Lancamento[], competencia: string) =>
  round2(lancs.reduce((s, l) => (l.competencia < competencia ? s + sinal(l) : s), 0));

/** Saldo acumulado ATÉ a competência, inclusive (o "SALDO" da planilha). */
export const saldoAcumulado = (lancs: Lancamento[], competencia: string) =>
  round2(lancs.reduce((s, l) => (l.competencia <= competencia ? s + sinal(l) : s), 0));
