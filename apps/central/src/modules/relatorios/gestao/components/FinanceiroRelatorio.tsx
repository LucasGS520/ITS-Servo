import { useState } from "react";
import { Input } from "@/common/ui/input";
import { formatBRL } from "@/common/constants/pricing";
import { useLancamentos, usePendenciasConciliacao, useSaldosIniciais } from "@/modules/financeiro/api";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";
import { mesLocal, relatorioAnual, relatorioGeralMensal, relatorioNucleoMensal } from "@/modules/relatorios/model/financeiro";
import type { DocumentoRelatorio } from "../lib/imprimirRelatorio";
import ReportView from "./ReportView";

const moeda = (v: number) => formatBRL(v);
const historico = "O período inclui dados provisórios ou com dia desconhecido. Confira a origem dos movimentos na área Financeiro.";

export default function FinanceiroRelatorio() {
  const [tipo, setTipo] = useState<"geral" | "nucleo" | "anual">("geral");
  const [mes, setMes] = useState(mesLocal());
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [unidade, setUnidade] = useState(UNIDADES_FINANCEIRO[0]?.value ?? "");
  const movQ = useLancamentos(), saldosQ = useSaldosIniciais(), cursosQ = useCursos(), edicoesQ = useEdicoesSimposio(), pendenciasQ = usePendenciasConciliacao(), enderecoQ = useEnderecoRelatorios();
  const consultas = [movQ, saldosQ, cursosQ, edicoesQ, pendenciasQ, enderecoQ];
  const movimentos = movQ.data ?? [], saldos = saldosQ.data ?? [], endereco = enderecoQ.data ?? "";
  let documento: DocumentoRelatorio;

  if (tipo === "nucleo") {
    const r = relatorioNucleoMensal(movimentos, mes, unidade);
    documento = { titulo: `Relatório financeiro por núcleo · ${UNIDADE_LABELS[unidade] ?? unidade}`, periodo: mes, endereco, financeiro: true,
      colunas: ["Data", "Aluno / histórico", "Entrada", "Saída", "Saldo do mês"],
      linhas: r.linhas.map(l => [l.data, l.nome, l.entrada ? moeda(l.entrada) : "—", l.saida ? moeda(l.saida) : "—", moeda(l.saldo)]),
      resumo: [{ rotulo: "Entrada do mês", valor: moeda(r.entradas) }, { rotulo: "Saída do mês", valor: moeda(r.saidas) }, { rotulo: "Resultado do núcleo no mês", valor: moeda(r.resultado) }],
      observacoes: ["O saldo por núcleo parte de zero no início do mês.", ...(r.linhas.some(l => l.provisorio) ? [historico] : [])] };
  } else if (tipo === "anual") {
    const r = relatorioAnual(movimentos, ano, saldos);
    documento = { titulo: "Relatório financeiro anual consolidado", periodo: ano, endereco, financeiro: true,
      colunas: ["Mês", "Entrada", "Saída", "Resultado", "Saldo anterior", "Saldo final"],
      linhas: r.meses.map(m => [m.mes, moeda(m.entradas), moeda(m.saidas), moeda(m.resultado), moeda(m.anterior), moeda(m.saldo)]),
      resumo: [{ rotulo: "Entradas no ano", valor: moeda(r.entradas) }, { rotulo: "Saídas no ano", valor: moeda(r.saidas) }, { rotulo: "Saldo anterior ao ano", valor: moeda(r.anterior) }, { rotulo: "Saldo final", valor: moeda(r.saldoFinal) }],
      observacoes: [...(r.movimentos.some(l => l.conciliacao_status !== "conciliado" || l.precisao_data === "mes") ? [historico] : []), ...(pendenciasQ.data ?? []).some(p => p.status === "aberta" && p.chave.includes(ano)) ? ["Há pendências de conciliação abertas para este ano."] : []] };
  } else {
    const r = relatorioGeralMensal(movimentos, mes, saldos, cursosQ.data ?? [], edicoesQ.data ?? []);
    documento = { titulo: "Relatório financeiro geral", periodo: mes, endereco, financeiro: true,
      colunas: ["Histórico", "Entrada", "Saída", "Resultado da linha"],
      linhas: r.grupos.map(g => [g.nome, g.entradas ? moeda(g.entradas) : "—", g.saidas ? moeda(g.saidas) : "—", moeda(g.resultado)]),
      resumo: [{ rotulo: "Entrada do mês", valor: moeda(r.entradas) }, { rotulo: "Saída do mês", valor: moeda(r.saidas) }, { rotulo: "Resultado do mês", valor: moeda(r.resultado) }, { rotulo: "Saldo anterior", valor: moeda(r.anterior) }, { rotulo: "Saldo final", valor: moeda(r.saldoFinal) }],
      observacoes: [...(r.movimentos.some(l => l.conciliacao_status !== "conciliado" || l.precisao_data === "mes") ? [historico] : []), ...(pendenciasQ.data ?? []).some(p => p.status === "aberta" && p.chave.includes(mes.slice(0, 4))) ? ["Há pendências de conciliação abertas para este ano."] : []] };
  }

  return <div className="space-y-5"><div className="flex flex-wrap gap-3">
    <label className="text-sm">Tipo<select aria-label="Tipo de relatório financeiro" className="mt-1 block h-10 rounded border bg-background px-3" value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}><option value="geral">Mensal geral</option><option value="nucleo">Mensal por núcleo</option><option value="anual">Anual consolidado</option></select></label>
    {tipo === "anual" ? <label className="text-sm">Ano<Input className="mt-1 w-28" type="number" min="2000" max="2100" value={ano} onChange={e => setAno(e.target.value)} /></label> : <label className="text-sm">Mês<Input className="mt-1 w-44" type="month" value={mes} onChange={e => setMes(e.target.value)} /></label>}
    {tipo === "nucleo" && <label className="text-sm">Núcleo<select aria-label="Núcleo" className="mt-1 block h-10 rounded border bg-background px-3" value={unidade} onChange={e => setUnidade(e.target.value)}>{UNIDADES_FINANCEIRO.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label>}
  </div>
  {consultas.some(q => q.isLoading) && <p>Carregando dados do relatório...</p>}
  {consultas.some(q => q.isError) && <p className="text-destructive">Falha ao carregar os dados. A impressão está indisponível.</p>}
  {!consultas.some(q => q.isLoading || q.isError) && <ReportView documento={documento} pronto={!consultas.some(q => q.isFetching)} />}
  </div>;
}
