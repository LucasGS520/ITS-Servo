import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { formatBRL } from "@/common/constants/pricing";
import { useAlunos, useLancamentos } from "@/modules/financeiro/api";
import { useCursos } from "@/modules/atividades/api";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import { totais } from "@/modules/relatorios/model/financeiro";
import { useEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";
import ReportView from "./ReportView";
import type { DocumentoRelatorio } from "../lib/imprimirRelatorio";

const SITUACAO: Record<string, string> = { pendente_validacao: "Histórico pendente", ativo: "Ativo", pausado: "Pausado", concluido: "Concluído", cancelado: "Cancelado" };
const moeda = (n: number) => formatBRL(n);

export default function CursosRelatorio() {
  const [params] = useSearchParams();
  const [cursoId, setCursoId] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [nucleo, setNucleo] = useState("todos");
  const cursosQ = useCursos(), alunosQ = useAlunos(), movQ = useLancamentos(), enderecoQ = useEnderecoRelatorios();
  const consultas = [cursosQ, alunosQ, movQ, enderecoQ];
  const alunoDoLink = (alunosQ.data ?? []).find(a => a.id === params.get("aluno"));
  const curso = (cursosQ.data ?? []).find(c => c.id === (cursoId || params.get("curso") || alunoDoLink?.curso_id)) ?? cursosQ.data?.[0];
  const lista = (alunosQ.data ?? []).filter(a => a.curso_id === curso?.id && (nucleo === "todos" || a.unidade === nucleo));
  const movimentos = (movQ.data ?? []).filter(l => l.curso_id === curso?.id && l.mes_caixa.slice(0, 4) === ano && (nucleo === "todos" || l.unidade === nucleo));
  const t = totais(movimentos);
  const agregado = movimentos.filter(l => l.tipo === "entrada" && !l.aluno_id && !l.inscricao_id).reduce((s, l) => s + Number(l.valor), 0);
  const doc: DocumentoRelatorio | null = curso ? { titulo: `Relatório do curso · ${curso.nome}`, periodo: `${ano}${nucleo === "todos" ? "" : ` · ${UNIDADE_LABELS[nucleo] ?? nucleo}`}`, endereco: enderecoQ.data ?? "",
    colunas: ["Aluno identificado", "Núcleo atual", "Situação atual", "Recebido no ano", "Devolvido no ano"],
    linhas: lista.map(a => { const m = movimentos.filter(l => l.aluno_id === a.id || Boolean(a.inscricao_id && l.inscricao_id === a.inscricao_id)); return [a.nome, UNIDADE_LABELS[a.unidade] ?? a.unidade, SITUACAO[a.situacao] ?? a.situacao, moeda(m.filter(l => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0)), moeda(m.filter(l => l.tipo === "saida" && !!l.estorno_de_id).reduce((s, l) => s + Number(l.valor), 0))]; }),
    resumo: [{ rotulo: "Alunos no cadastro", valor: String(lista.length) }, { rotulo: "Entradas vinculadas", valor: moeda(t.entradas) }, { rotulo: "Saídas vinculadas", valor: moeda(t.saidas) }, { rotulo: "Resultado", valor: moeda(t.resultado) }, { rotulo: "Entradas sem aluno ou inscrição identificada", valor: moeda(agregado) }],
    observacoes: ["Situação e núcleo dos alunos são atuais. O caixa respeita o ano e a unidade registrados no movimento.", ...(movimentos.some(l => l.conciliacao_status !== "conciliado" || l.precisao_data === "mes") ? ["Há dados históricos provisórios neste período."] : [])] } : null;

  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><label className="text-sm">Curso<select aria-label="Curso" className="mt-1 block h-10 rounded border bg-background px-3" value={curso?.id ?? ""} onChange={e => setCursoId(e.target.value)}>{(cursosQ.data ?? []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label><label className="text-sm">Ano<Input className="mt-1 w-28" type="number" min="2000" max="2100" value={ano} onChange={e => setAno(e.target.value)} /></label><label className="text-sm">Núcleo<select aria-label="Núcleo do curso" className="mt-1 block h-10 rounded border bg-background px-3" value={nucleo} onChange={e => setNucleo(e.target.value)}><option value="todos">Todos</option>{UNIDADES_FINANCEIRO.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label></div>
    {curso && <Button variant="outline" asChild><Link to={`/painel/instituto?secao=alunos&curso=${curso.id}`}>Abrir alunos no Instituto</Link></Button>}
    {consultas.some(q => q.isLoading) && <p>Carregando dados do curso...</p>}
    {consultas.some(q => q.isError) && <p className="text-destructive">Falha ao carregar o relatório. A impressão está indisponível.</p>}
    {!consultas.some(q => q.isLoading || q.isError) && doc && <ReportView documento={doc} pronto={!consultas.some(q => q.isFetching)} />}
    {!consultas.some(q => q.isLoading || q.isError) && !doc && <p>Nenhum curso cadastrado.</p>}
  </div>;
}
