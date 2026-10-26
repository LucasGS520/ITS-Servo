import type { Lancamento } from "@/modules/financeiro/api";
import { round2, saldoAnterior } from "@/modules/financeiro/model/agregados";
import { UNIDADE_LABELS } from "@/modules/financeiro/model/unidades";

export type Movimento = Lancamento;
export type Grupo = { chave: string; nome: string; entradas: number; saidas: number; resultado: number };
export type LinhaNucleo = { id: string; data: string; nome: string; entrada: number; saida: number; saldo: number; provisorio: boolean };
export const moeda = (n: number) => round2(n);
export const mesLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const dataMovimento = (l: Movimento) => l.data ? new Date(`${l.data}T12:00:00`).toLocaleDateString("pt-BR") : `${l.mes_caixa.slice(5, 7)}/${l.mes_caixa.slice(0, 4)} (dia desconhecido)`;

export function totais(movimentos: Movimento[]) {
  const entradas = moeda(movimentos.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0));
  const saidas = moeda(movimentos.filter(l => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0));
  return { entradas, saidas, resultado: moeda(entradas - saidas) };
}

export function relatorioGeralMensal(
  movimentos: Movimento[], mes: string,
  saldos: { ano: number; valor: number }[],
  cursos: { id: string; nome: string; codigo: string }[],
  edicoes: { id: string; nome: string }[],
  unidadeLabels: Record<string, string> = UNIDADE_LABELS,
) {
  const doMes = movimentos.filter(l => l.mes_caixa.slice(0, 7) === mes);
  const grupos = new Map<string, Grupo>();
  for (const l of doMes) {
    const curso = cursos.find(c => c.id === l.curso_id);
    const edicao = edicoes.find(e => e.id === l.edicao_simposio_id);
    const categoria = l.categoria?.nome ?? "Sem categoria";
    let chave: string;
    let nome: string;
    if (l.tipo === "saida") {
      chave = `saida:${edicao?.id ?? l.categoria_id ?? "sem-categoria"}`;
      nome = edicao ? `Saída · ${edicao.nome}` : `Saída · ${categoria}`;
    } else if (edicao) {
      chave = `edicao:${edicao.id}`; nome = edicao.nome;
    } else if (curso?.codigo === "teologico" && l.unidade) {
      chave = `teologico:${l.unidade}`; nome = unidadeLabels[l.unidade] ?? l.unidade;
    } else if (curso) {
      chave = `curso:${curso.id}`; nome = curso.nome;
    } else {
      chave = `categoria:${l.categoria_id ?? "sem-categoria"}:${l.unidade ?? "geral"}`;
      nome = l.unidade ? `${categoria} · ${unidadeLabels[l.unidade] ?? l.unidade}` : categoria;
    }
    const grupo = grupos.get(chave) ?? { chave, nome, entradas: 0, saidas: 0, resultado: 0 };
    if (l.tipo === "entrada") grupo.entradas += Number(l.valor);
    else grupo.saidas += Number(l.valor);
    grupo.entradas = moeda(grupo.entradas);
    grupo.saidas = moeda(grupo.saidas);
    grupo.resultado = moeda(grupo.entradas - grupo.saidas);
    grupos.set(chave, grupo);
  }
  const calculo = totais(doMes);
  const anterior = saldoAnterior(movimentos, `${mes}-01`, saldos);
  return { grupos: [...grupos.values()].sort((a, b) => Number(a.saidas > 0) - Number(b.saidas > 0) || a.nome.localeCompare(b.nome, "pt-BR")), ...calculo, anterior, saldoFinal: moeda(anterior + calculo.resultado), movimentos: doMes };
}

export function relatorioNucleoMensal(movimentos: Movimento[], mes: string, unidade: string) {
  const selecionados = movimentos.filter(l => l.mes_caixa.slice(0, 7) === mes && l.unidade === unidade)
    .sort((a, b) => (a.data ?? "9999-99-99").localeCompare(b.data ?? "9999-99-99") || a.created_at.localeCompare(b.created_at));
  let saldo = 0;
  const linhas: LinhaNucleo[] = selecionados.map(l => {
    const entrada = l.tipo === "entrada" ? Number(l.valor) : 0;
    const saida = l.tipo === "saida" ? Number(l.valor) : 0;
    saldo = moeda(saldo + entrada - saida);
    return { id: l.id, data: dataMovimento(l), nome: l.aluno?.nome ?? l.inscricao?.nome_completo ?? l.descricao ?? l.categoria?.nome ?? "Movimento sem descrição", entrada, saida, saldo, provisorio: l.conciliacao_status !== "conciliado" || l.precisao_data === "mes" };
  });
  return { linhas, ...totais(selecionados), saldoFinal: saldo, movimentos: selecionados };
}

export function relatorioAnual(movimentos: Movimento[], ano: string, saldos: { ano: number; valor: number }[]) {
  const anterior = saldoAnterior(movimentos, `${ano}-01-01`, saldos);
  let acumulado = anterior;
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = `${ano}-${String(i + 1).padStart(2, "0")}`;
    const lista = movimentos.filter(l => l.mes_caixa.slice(0, 7) === mes);
    const t = totais(lista);
    const saldoAnteriorMes = acumulado;
    acumulado = moeda(acumulado + t.resultado);
    return { mes, ...t, anterior: saldoAnteriorMes, saldo: acumulado };
  });
  const doAno = movimentos.filter(l => l.mes_caixa.slice(0, 4) === ano);
  return { meses, anterior, saldoFinal: acumulado, ...totais(doAno), movimentos: doAno };
}
