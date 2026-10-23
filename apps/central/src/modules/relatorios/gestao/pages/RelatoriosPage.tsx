import { Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { formatBRL } from "@/common/constants/pricing";
import MensalTab from "@/modules/financeiro/gestao/components/MensalTab";
import AnualTab from "@/modules/financeiro/gestao/components/AnualTab";
import { useMatriculas } from "@/modules/matriculas/api";
import { useAlunos, useLancamentos, usePendenciasConciliacao } from "@/modules/financeiro/api";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { UNIDADE_LABELS } from "@/modules/financeiro/model/unidades";

const Impressao = () => <Button className="print:hidden" variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>;

const InscricoesRelatorio = () => {
  const { data = [] } = useMatriculas();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  return <Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Inscrição</TableHead><TableHead>Nome</TableHead><TableHead>Atividade</TableHead><TableHead>Situação</TableHead><TableHead>Origem</TableHead></TableRow></TableHeader><TableBody>{data.map((i) => <TableRow key={i.id}><TableCell>{i.numero_inscricao}</TableCell><TableCell>{i.nome_completo}</TableCell><TableCell>{i.curso_id ? cursos.find((curso) => curso.id === i.curso_id)?.nome ?? "Curso" : edicoes.find((edicao) => edicao.id === i.edicao_simposio_id)?.nome ?? "Simpósio"}</TableCell><TableCell>{i.status}</TableCell><TableCell>{i.origem_cadastro}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
};

const AlunosRelatorio = () => {
  const { data: alunos = [] } = useAlunos();
  const { data: lancamentos = [] } = useLancamentos();
  return <Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Núcleo</TableHead><TableHead>Situação</TableHead><TableHead>Recebido</TableHead><TableHead>Pagamentos por categoria e mês</TableHead></TableRow></TableHeader><TableBody>{alunos.map((a) => { const movimentos = lancamentos.filter((l) => l.aluno_id === a.id || Boolean(a.inscricao_id && l.inscricao_id === a.inscricao_id)); const entradas = movimentos.filter((l) => l.tipo === "entrada"); const recebido = entradas.reduce((s, l) => s + Number(l.valor), 0); const devolvido = movimentos.filter((l) => l.tipo === "saida" && l.estorno_de_id).reduce((s, l) => s + Number(l.valor), 0); return <TableRow key={a.id}><TableCell>{a.nome}</TableCell><TableCell>{UNIDADE_LABELS[a.unidade] ?? a.unidade}</TableCell><TableCell>{a.situacao}</TableCell><TableCell>{formatBRL(recebido)}{devolvido > 0 && <p className="text-xs text-muted-foreground">Devolvido: {formatBRL(devolvido)}</p>}</TableCell><TableCell className="text-xs">{entradas.length === 0 ? "—" : entradas.map((l) => <p key={l.id}>{l.categoria?.nome ?? "Entrada"} · {l.finalidade === "mensalidade" ? l.mes_referencia?.slice(0, 7) ?? "mês desconhecido" : l.finalidade === "matricula" ? "matrícula" : l.mes_caixa.slice(0, 7)} · {formatBRL(Number(l.valor))}</p>)}{a.origem_referencia && <span className="text-amber-700">Histórico provisório</span>}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>;
};

const CursosRelatorio = () => {
  const { data: cursos = [] } = useCursos();
  const { data: alunos = [] } = useAlunos();
  const { data: lancamentos = [] } = useLancamentos();
  return <div className="grid gap-4 md:grid-cols-2">{cursos.map((curso) => { const movimentos = lancamentos.filter((l) => l.curso_id === curso.id); const entrada = movimentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0); const saida = movimentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0); return <Card key={curso.id}><CardContent className="space-y-2 p-5"><strong>{curso.nome}</strong><p>{alunos.filter((a) => a.curso_id === curso.id).length} alunos no cadastro</p><p>Entradas registradas: {formatBRL(entrada)} · Saídas vinculadas: {formatBRL(saida)} · Resultado: {formatBRL(entrada - saida)}</p><p className="text-xs text-muted-foreground">Inclui histórico mensal provisório quando disponível. A Capacitação de 2026 tem valor agregado, sem participantes identificados.</p></CardContent></Card>; })}</div>;
};

const SimposiosRelatorio = () => {
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: inscricoes = [] } = useMatriculas();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: pendencias = [] } = usePendenciasConciliacao();
  return <div className="space-y-4">{edicoes.map((e) => { const movimentos = lancamentos.filter((l) => l.edicao_simposio_id === e.id); const receita = movimentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0); const custo = movimentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0); const abertas = pendencias.filter((p) => p.chave.startsWith("simposio2026") && p.status === "aberta"); return <Card key={e.id}><CardContent className="space-y-2 p-5"><strong>{e.nome}</strong><p>{Number(e.inscritos_historicos ?? 0) + inscricoes.filter((i) => i.edicao_simposio_id === e.id && i.status !== "cancelado").length} inscritos{e.inscritos_historicos != null && ` · ${e.pagantes_historicos} pagantes históricos · ${e.isentos_historicos} isentos históricos`}</p><p>Caixa vinculado: {formatBRL(receita)} de entradas · {formatBRL(custo)} de saídas · resultado {formatBRL(receita - custo)}</p>{abertas.length > 0 && <p className="text-sm text-amber-700">Detalhe do evento diverge do relatório anual: entradas +R$ 510,00 e saídas +R$ 560,00 ainda em conciliação.</p>}</CardContent></Card>; })}</div>;
};

const RelatoriosPage = () => <div className="container space-y-6 py-8"><div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Relatórios</h1><p className="mt-1 text-sm text-muted-foreground">Caixa por mês da entrada ou saída; o mês pago, quando conhecido, aparece no relatório dos alunos.</p></div><Impressao /></div><Tabs defaultValue="financeiro"><TabsList className="flex-wrap"><TabsTrigger value="financeiro">Financeiro</TabsTrigger><TabsTrigger value="inscricoes">Inscrições</TabsTrigger><TabsTrigger value="alunos">Alunos</TabsTrigger><TabsTrigger value="cursos">Cursos</TabsTrigger><TabsTrigger value="simposios">Simpósios</TabsTrigger></TabsList><TabsContent value="financeiro" className="space-y-8"><MensalTab /><AnualTab /></TabsContent><TabsContent value="inscricoes"><InscricoesRelatorio /></TabsContent><TabsContent value="alunos"><AlunosRelatorio /></TabsContent><TabsContent value="cursos"><CursosRelatorio /></TabsContent><TabsContent value="simposios"><SimposiosRelatorio /></TabsContent></Tabs></div>;
export default RelatoriosPage;
