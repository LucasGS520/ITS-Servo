import { useUrlFilter } from "@/common/hooks/useUrlFilter";
import { useUnidades } from "@/modules/instituto/api/useUnidades";
import { useOperationalStatus } from "@/common/hooks/useOperationalStatus";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Plus, Search } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useLancamentos } from "@/modules/financeiro/api";
import { useIsencoesInscricao, useMatriculas, usePedidosCancelamento } from "@/modules/matriculas/api";
import { nomeAtividade, situacaoFinanceira } from "@/modules/matriculas/model/financeiro";
import { STATUS_INSCRICAO_INFO, statusInscricaoOuPadrao } from "@/modules/matriculas/model";
import { NovaInscricaoDialog } from "./NovaInscricaoDialog";
import { FichaInscricaoDialog } from "./FichaInscricaoDialog";

const InscricoesPage = () => {
  const { unidades, labels } = useUnidades();
  const { data: inscricoes = [], isLoading, error } = useMatriculas();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: isencoes = [] } = useIsencoesInscricao();
  const { data: pedidos = [] } = usePedidosCancelamento();
  const [busca, setBusca] = useState("");
  const [atividade, setAtividade] = useUrlFilter<string>("atividade", "todas");
  const [nucleo, setNucleo] = useUrlFilter<string>("nucleo", "todos");
  const [origem, setOrigem] = useUrlFilter<string>("origem", "todas");
  const [periodo, setPeriodo] = useUrlFilter<string>("periodo", "");
  const [status, setStatus] = useUrlFilter<string>("status", "todos");
  const [financeiro, setFinanceiro] = useUrlFilter<string>("financeiro", "todos");
  const [params, setParams] = useSearchParams();
  const selecionadaId = params.get("id");
  const setSelecionadaId = (id: string | null) => setParams(previous => { const next = new URLSearchParams(previous); if (id) next.set("id", id); else next.delete("id"); return next; }, { replace: true });
  const [nova, setNova] = useState(params.get("nova") === "1");
  const selecionada = inscricoes.find((item) => item.id === selecionadaId) ?? null;
  const pendentes = useMemo(() => new Set(pedidos.filter((item) => item.status === "pendente").map((item) => item.inscricao_id)), [pedidos]);
  const nucleos = unidades.filter(item => item.value !== "correspondencia");
  const linhas = useMemo(() => inscricoes.map((item) => {
    const movimentos = lancamentos.filter((movimento) => movimento.inscricao_id === item.id ||
      Boolean(movimento.estorno_de_id && lancamentos.some((entrada) => entrada.id === movimento.estorno_de_id && entrada.inscricao_id === item.id)));
    const valor = item.valor_referencia ?? null;
    return { item, nome: nomeAtividade(item, cursos, edicoes), situacao: situacaoFinanceira(item, movimentos, valor,
      isencoes.filter((isencao) => isencao.inscricao_id === item.id)) };
  }).filter(({ item, nome, situacao }) => {
    const termo = busca.trim().toLowerCase();
    if (termo && ![item.nome_completo, item.cpf, item.numero_inscricao].some((value) => value?.toLowerCase().includes(termo))) return false;
    if (atividade !== "todas" && !(atividade.startsWith("curso:") ? item.curso_id === atividade.slice(6) : item.edicao_simposio_id === atividade.slice(9))) return false;
    if (nucleo !== "todos" && (nucleo === "correspondencia" ? item.modalidade !== "correspondencia" : item.nucleo !== nucleo)) return false;
    if (origem !== "todas" && item.origem_cadastro !== origem) return false;
    if (periodo && item.created_at.slice(0, 7) !== periodo) return false;
    if (status !== "todos" && (status === "pedido_cancelamento" ? !pendentes.has(item.id) : item.status !== status)) return false;
    if (financeiro !== "todos" && situacao !== financeiro) return false;
    return Boolean(nome);
  }), [inscricoes, lancamentos, cursos, edicoes, isencoes, busca, atividade, nucleo, origem, periodo, status, financeiro, pendentes]);

  const saude = useOperationalStatus(["inscricoes", "lancamentos_financeiros", "cursos", "edicoes_simposio", "isencoes-inscricao", "pedidos-cancelamento-inscricao"]);
  if (saude.semDados) return <p role="status" className="p-6">{saude.erro ? "Não foi possível atualizar os dados. Os valores não serão apresentados até recuperar a conexão." : "Carregando dados..."}</p>;
  return <div className="container space-y-6 py-8">
    {saude.erro && <p role="alert" className="text-destructive">Falha ao atualizar. Exibindo os últimos dados carregados; ações indisponíveis até recuperar a conexão.</p>}
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Inscrições</h1><p className="text-sm text-muted-foreground">Solicitações do site e da Central, decisões e financeiro vinculado.</p></div><Button disabled={saude.bloqueado} onClick={() => setNova(true)}><Plus className="mr-2 h-4 w-4" />Nova inscrição</Button></div>
    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2"><Label htmlFor="insc-busca">Buscar</Label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="insc-busca" className="pl-9" placeholder="Nome, CPF ou número" value={busca} onChange={(e) => setBusca(e.target.value)} /></div></div>
      <div><Label htmlFor="insc-atividade">Atividade</Label><select id="insc-atividade" className="h-10 w-full rounded-md border bg-background px-2" value={atividade} onChange={(e) => setAtividade(e.target.value)}><option value="todas">Todas</option>{cursos.map((item) => <option key={item.id} value={`curso:${item.id}`}>{item.nome}</option>)}{edicoes.map((item) => <option key={item.id} value={`simposio:${item.id}`}>{item.nome}</option>)}</select></div>
      <div><Label htmlFor="insc-nucleo">Núcleo</Label><select id="insc-nucleo" className="h-10 w-full rounded-md border bg-background px-2" value={nucleo} onChange={(e) => setNucleo(e.target.value)}><option value="todos">Todos</option><option value="correspondencia">Correspondência</option>{nucleos.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div><Label htmlFor="insc-origem">Origem</Label><select id="insc-origem" className="h-10 w-full rounded-md border bg-background px-2" value={origem} onChange={(e) => setOrigem(e.target.value)}><option value="todas">Todas</option><option value="site">Site</option><option value="central">Central</option><option value="historico">Histórico</option></select></div>
      <div><Label htmlFor="insc-periodo">Mês da inscrição</Label><Input id="insc-periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
      <div><Label htmlFor="insc-status">Situação</Label><select id="insc-status" className="h-10 w-full rounded-md border bg-background px-2" value={status} onChange={(e) => setStatus(e.target.value)}><option value="todos">Todas</option><option value="pedido_cancelamento">Pedido de cancelamento</option>{Object.entries(STATUS_INSCRICAO_INFO).map(([key, info]) => <option key={key} value={key}>{info.labelGestao}</option>)}</select></div>
      <div><Label htmlFor="insc-financeiro">Financeiro</Label><select id="insc-financeiro" className="h-10 w-full rounded-md border bg-background px-2" value={financeiro} onChange={(e) => setFinanceiro(e.target.value)}><option value="todos">Todas</option>{["Gratuita", "Sem recebimento", "Comprovante a conferir · sem recebimento", "Recebido parcialmente", "Valor recebido", "Valor não configurado", "Recebimento com valor não configurado", "Isenta", "Isenção antiga · revisar alcance"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    </CardContent></Card>
    <p className="text-sm text-muted-foreground">{linhas.length} inscrição(ões) com os filtros atuais. Situação financeira refere-se à matrícula do curso ou à inscrição no evento; mensalidades aparecem na ficha por mês pago.</p>
    {error && <p className="text-destructive">Não foi possível carregar as inscrições.</p>}
    <Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Número / data</TableHead><TableHead>Pessoa</TableHead><TableHead>Atividade</TableHead><TableHead>Origem / núcleo</TableHead><TableHead>Inscrição</TableHead><TableHead>Financeiro</TableHead><TableHead /></TableRow></TableHeader><TableBody>
      {isLoading && <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>}
      {!isLoading && linhas.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center">Nenhuma inscrição encontrada.</TableCell></TableRow>}
      {linhas.map(({ item, nome, situacao }) => <TableRow key={item.id}><TableCell className="whitespace-nowrap">{item.numero_inscricao}<p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</p></TableCell><TableCell>{item.nome_completo}</TableCell><TableCell>{nome}</TableCell><TableCell>{item.origem_cadastro}<p className="text-xs text-muted-foreground">{item.modalidade === "correspondencia" ? "Correspondência" : (item.nucleo ? labels[item.nucleo] ?? item.nucleo : "Sem núcleo")}</p></TableCell><TableCell><Badge variant="outline">{STATUS_INSCRICAO_INFO[statusInscricaoOuPadrao(item.status)].labelGestao}</Badge>{pendentes.has(item.id) && <p className="text-xs text-amber-700">Cancelamento solicitado</p>}</TableCell><TableCell className="text-xs">{situacao}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`Abrir inscrição ${item.numero_inscricao}`} onClick={() => setSelecionadaId(item.id)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}
    </TableBody></Table></CardContent></Card>
    <NovaInscricaoDialog open={nova} onClose={() => setNova(false)} onCreated={(id) => { setNova(false); setSelecionadaId(id); }} />
    <FichaInscricaoDialog inscricao={selecionada} onClose={() => setSelecionadaId(null)} />
  </div>;
};

export default InscricoesPage;
