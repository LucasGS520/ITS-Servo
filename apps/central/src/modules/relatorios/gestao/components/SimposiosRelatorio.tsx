import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/common/ui/button";
import { formatBRL } from "@/common/constants/pricing";
import { useEdicoesSimposio } from "@/modules/atividades/api";
import { useMatriculas } from "@/modules/matriculas/api";
import { useLancamentos, usePendenciasConciliacao } from "@/modules/financeiro/api";
import { useEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";
import { totais } from "@/modules/relatorios/model/financeiro";
import { useIsencoesRelatorios } from "@/modules/relatorios/api/useIsencoesRelatorios";
import ReportView from "./ReportView";
import type { DocumentoRelatorio } from "../lib/imprimirRelatorio";

const STATUS: Record<string, string> = { em_analise: "Em análise", comprovante_enviado: "Comprovante enviado", pagamento_nao_identificado: "Pagamento não identificado", confirmada: "Confirmada", cancelado: "Cancelada" };
const moeda = (v: number) => formatBRL(v);

export default function SimposiosRelatorio() {
  const [params] = useSearchParams();
  const [edicaoId, setEdicaoId] = useState(params.get("edicao") ?? "");
  const edicoesQ = useEdicoesSimposio(), inscricoesQ = useMatriculas(), movQ = useLancamentos(), pendenciasQ = usePendenciasConciliacao(), isencoesQ = useIsencoesRelatorios(), enderecoQ = useEnderecoRelatorios();
  const consultas = [edicoesQ, inscricoesQ, movQ, pendenciasQ, isencoesQ, enderecoQ];
  const edicao = (edicoesQ.data ?? []).find(e => e.id === edicaoId) ?? edicoesQ.data?.[0];
  const inscricoes = (inscricoesQ.data ?? []).filter(i => i.edicao_simposio_id === edicao?.id);
  const movimentos = (movQ.data ?? []).filter(l => l.edicao_simposio_id === edicao?.id);
  const t = totais(movimentos);
  const isentos = (isencoesQ.data ?? []).filter(i => i.ativo && i.finalidade === "inscricao_evento" && inscricoes.some(ins => ins.id === i.inscricao_id)).length;
  const pendencia = !!edicao?.origem_referencia && (pendenciasQ.data ?? []).some(p => p.status === "aberta" && p.chave.startsWith("simposio2026"));
  const doc: DocumentoRelatorio | null = edicao ? { titulo: `Relatório do Simpósio · ${edicao.nome}`, periodo: edicao.inicio && edicao.fim ? `${edicao.inicio} a ${edicao.fim}` : "Edição completa", endereco: enderecoQ.data ?? "",
    colunas: ["Participante identificado", "Inscrição", "Situação", "Recebido", "Devolvido"],
    linhas: inscricoes.map(i => { const m = movimentos.filter(l => l.inscricao_id === i.id); return [i.nome_completo, i.numero_inscricao ?? "—", STATUS[i.status] ?? i.status, moeda(m.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0)), moeda(m.filter(l => l.tipo === "saida" && !!l.estorno_de_id).reduce((s, l) => s + Number(l.valor), 0))]; }),
    resumo: [{ rotulo: "Inscritos históricos agregados", valor: String(edicao.inscritos_historicos ?? "—") }, { rotulo: "Pagantes históricos agregados", valor: String(edicao.pagantes_historicos ?? "—") }, { rotulo: "Isentos históricos agregados", valor: String(edicao.isentos_historicos ?? "—") }, { rotulo: "Inscrições identificadas", valor: String(inscricoes.filter(i => i.status !== "cancelado").length) }, { rotulo: "Confirmados identificados", valor: String(inscricoes.filter(i => i.status === "confirmada").length) }, { rotulo: "Isenções identificadas", valor: String(isentos) }, { rotulo: "Entradas vinculadas", valor: moeda(t.entradas) }, { rotulo: "Saídas vinculadas", valor: moeda(t.saidas) }, { rotulo: "Resultado do caixa", valor: moeda(t.resultado) }],
    observacoes: ["Os indicadores históricos agregados não representam pessoas desta lista e não são somados às inscrições identificadas.", ...(pendencia ? ["Esta edição tem diferenças históricas em conciliação. O caixa exibido vem das movimentações da Central."] : [])] } : null;

  return <div className="space-y-5"><label className="block text-sm">Edição<select aria-label="Edição do Simpósio" className="mt-1 block h-10 rounded border bg-background px-3" value={edicao?.id ?? ""} onChange={e => setEdicaoId(e.target.value)}>{(edicoesQ.data ?? []).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    {edicao && <Button asChild variant="outline"><Link to={`/painel/instituto/simposios/${edicao.id}`}>Abrir edição no Instituto</Link></Button>}
    {consultas.some(q => q.isLoading) && <p>Carregando dados da edição...</p>}
    {consultas.some(q => q.isError) && <p className="text-destructive">Falha ao carregar o relatório. A impressão está indisponível.</p>}
    {!consultas.some(q => q.isLoading || q.isError) && doc && <ReportView documento={doc} pronto={!consultas.some(q => q.isFetching)} />}
    {!consultas.some(q => q.isLoading || q.isError) && !doc && <p>Nenhuma edição cadastrada.</p>}
  </div>;
}
