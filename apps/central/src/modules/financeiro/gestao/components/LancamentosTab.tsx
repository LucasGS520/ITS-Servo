import { useMemo, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/common/ui/card";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { Loader2, Pencil, Plus, RotateCcw } from "lucide-react";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { obterUrlComprovante } from "@/modules/matriculas";
import { useCursos, useEdicoesSimposio } from "@/modules/atividades/api";
import { useCategorias, useLancamentos, useSaldosIniciais, type Lancamento } from "@/modules/financeiro/api";
import { useDevolverMovimentacao } from "@/modules/financeiro/api/movimentacoes";
import { formatData, mesParaCompetencia, saldoAcumulado, totaisDoMes } from "@/modules/financeiro/model/agregados";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import LancamentoDialog from "./LancamentoDialog";

const hoje = () => new Date().toLocaleDateString("en-CA");
const valorNumerico = (texto: string) => Number(texto.trim().includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto);
const finalidadeLabel: Record<string, string> = { matricula: "Matrícula", mensalidade: "Mensalidade", inscricao_evento: "Inscrição em evento", outro: "Outro" };

const LancamentosTab = () => {
  const { toast } = useToast();
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const { data: categorias = [] } = useCategorias();
  const { data: cursos = [] } = useCursos();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: saldos = [] } = useSaldosIniciais();
  const devolver = useDevolverMovimentacao();
  const [mes, setMes] = useState(hoje().slice(0, 7));
  const [unidade, setUnidade] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [atividade, setAtividade] = useState("todas");
  const [origem, setOrigem] = useState("todas");
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [devolvendo, setDevolvendo] = useState<Lancamento | null>(null);
  const [valorDevolucao, setValorDevolucao] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState(hoje);
  const [categoriaDevolucao, setCategoriaDevolucao] = useState("");
  const [observacaoDevolucao, setObservacaoDevolucao] = useState("");
  const competencia = mesParaCompetencia(mes);

  const totalDevolvido = (id: string) => lancamentos.filter((item) => item.estorno_de_id === id && item.tipo === "saida").reduce((s, item) => s + Number(item.valor), 0);
  const { linhas, totais, acumulado, saldoReal } = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const escopo = lancamentos.filter((item) => {
      if (unidade !== "todas" && (unidade === "institucional" ? item.unidade !== null : item.unidade !== unidade)) return false;
      if (tipo !== "todos" && item.tipo !== tipo) return false;
      if (categoria !== "todas" && item.categoria_id !== categoria) return false;
      if (atividade !== "todas" && (atividade.startsWith("curso:") ? item.curso_id !== atividade.slice(6) : atividade.startsWith("simposio:") ? item.edicao_simposio_id !== atividade.slice(9) : item.curso_id !== null || item.edicao_simposio_id !== null)) return false;
      if (origem !== "todas" && item.origem !== origem) return false;
      if (termo && !`${item.aluno?.nome ?? ""} ${item.inscricao?.nome_completo ?? ""} ${item.inscricao?.numero_inscricao ?? ""} ${item.descricao ?? ""} ${item.categoria?.nome ?? ""}`.toLowerCase().includes(termo)) return false;
      return true;
    });
    const saldoReal = unidade === "todas" && tipo === "todos" && categoria === "todas" && atividade === "todas" && origem === "todas" && !termo;
    return {
      linhas: escopo.filter((item) => item.mes_caixa === competencia),
      totais: totaisDoMes(escopo, competencia),
      acumulado: saldoAcumulado(escopo, competencia, saldoReal ? saldos : []),
      saldoReal,
    };
  }, [lancamentos, competencia, unidade, tipo, categoria, atividade, origem, busca, saldos]);

  const abrirEdicao = (item: Lancamento | null) => { setEditando(item); setDialogOpen(true); };
  const abrirDevolucao = (item: Lancamento) => {
    setDevolvendo(item);
    setValorDevolucao(String(Math.max(0, Number(item.valor) - totalDevolvido(item.id))));
    setDataDevolucao(hoje());
    setCategoriaDevolucao(categorias.find((cat) => cat.nome === "Devolução Matrícula/Livros" && cat.tipo === "saida" && cat.ativo)?.id ?? "");
    setObservacaoDevolucao("");
  };
  const registrarDevolucao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!devolvendo) return;
    const valor = valorNumerico(valorDevolucao);
    if (!Number.isFinite(valor) || valor <= 0 || valor > Number(devolvendo.valor) - totalDevolvido(devolvendo.id)) {
      toast({ title: "Valor de devolução inválido", variant: "destructive" }); return;
    }
    try {
      await devolver.mutateAsync({ id: devolvendo.id, valor, data: dataDevolucao, categoriaId: categoriaDevolucao, descricao: observacaoDevolucao.trim() || null });
      toast({ title: "Devolução registrada no caixa" }); setDevolvendo(null);
    } catch (error) { toast({ title: "Não foi possível devolver", description: getErrorMessage(error), variant: "destructive" }); }
  };
  const abrirComprovante = async (path: string) => {
    try { window.open(await obterUrlComprovante(path), "_blank", "noopener,noreferrer"); }
    catch (error) { toast({ title: "Não foi possível abrir o comprovante", description: getErrorMessage(error), variant: "destructive" }); }
  };
  const atividadeNome = (item: Lancamento) => item.curso_id
    ? cursos.find((curso) => curso.id === item.curso_id)?.nome ?? "Curso"
    : item.edicao_simposio_id ? edicoes.find((edicao) => edicao.id === item.edicao_simposio_id)?.nome ?? "Simpósio" : "Geral do ITS";

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "Entradas do mês", valor: totais.entrada }, { label: "Saídas do mês", valor: totais.saida }, { label: "Resultado do mês", valor: totais.saldo }, { label: saldoReal ? "Saldo acumulado" : "Resultado acumulado filtrado", valor: acumulado }].map((item) => <Card key={item.label}><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-bold">{formatBRL(item.valor)}</p></CardContent></Card>)}
    </div>
    <p className="text-xs text-muted-foreground">Todos os indicadores e linhas respeitam os filtros abaixo. {saldoReal ? "O saldo acumulado inclui o saldo inicial do ITS." : "O resultado acumulado filtrado não inclui saldo inicial, pois ele não é dividido entre filtros."}</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div><Label htmlFor="f-mes">Mês do caixa</Label><Input id="f-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></div>
      <div><Label htmlFor="f-unidade">Unidade</Label><select id="f-unidade" className="h-10 w-full rounded-md border bg-background px-3" value={unidade} onChange={(e) => setUnidade(e.target.value)}><option value="todas">Geral consolidado · todas</option><option value="institucional">Geral institucional · sem unidade</option>{UNIDADES_FINANCEIRO.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div><Label htmlFor="f-tipo">Tipo</Label><select id="f-tipo" className="h-10 w-full rounded-md border bg-background px-3" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="todos">Entradas e saídas</option><option value="entrada">Entradas</option><option value="saida">Saídas</option></select></div>
      <div><Label htmlFor="f-categoria">Categoria</Label><select id="f-categoria" className="h-10 w-full rounded-md border bg-background px-3" value={categoria} onChange={(e) => setCategoria(e.target.value)}><option value="todas">Todas as categorias</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.tipo}</option>)}</select></div>
      <div><Label htmlFor="f-atividade">Atividade</Label><select id="f-atividade" className="h-10 w-full rounded-md border bg-background px-3" value={atividade} onChange={(e) => setAtividade(e.target.value)}><option value="todas">Todas as atividades</option><option value="geral">Geral do ITS</option>{cursos.map((item) => <option key={item.id} value={`curso:${item.id}`}>{item.nome}</option>)}{edicoes.map((item) => <option key={item.id} value={`simposio:${item.id}`}>{item.nome}</option>)}</select></div>
      <div><Label htmlFor="f-origem">Origem</Label><select id="f-origem" className="h-10 w-full rounded-md border bg-background px-3" value={origem} onChange={(e) => setOrigem(e.target.value)}><option value="todas">Todas</option><option value="legado">Histórico importado</option><option value="manual">Central</option><option value="pagamento">Recebimento anterior</option><option value="estorno">Devolução</option><option value="ajuste">Ajuste</option></select></div>
      <div className="sm:col-span-2"><Label htmlFor="f-busca">Buscar</Label><Input id="f-busca" placeholder="Nome, inscrição, descrição ou categoria" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
    </div>
    <div className="flex justify-end"><Button onClick={() => abrirEdicao(null)}><Plus className="mr-2 h-4 w-4" />Nova movimentação</Button></div>
    <Card><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Pagador / descrição</TableHead><TableHead>Atividade</TableHead><TableHead>Unidade</TableHead><TableHead>Categoria / referência</TableHead><TableHead>Origem</TableHead><TableHead className="text-right">Entrada</TableHead><TableHead className="text-right">Saída</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>
      {linhas.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Nenhuma movimentação neste mês com os filtros atuais.</TableCell></TableRow>}
      {linhas.map((item) => { const disponivel = item.tipo === "entrada" ? Number(item.valor) - totalDevolvido(item.id) : 0; return <TableRow key={item.id}>
        <TableCell className="whitespace-nowrap text-xs">{formatData(item.data, item.mes_caixa)}</TableCell>
        <TableCell><strong>{item.inscricao?.nome_completo ?? item.aluno?.nome ?? item.descricao ?? "—"}</strong>{item.inscricao && <p className="text-xs text-muted-foreground">{item.inscricao.numero_inscricao}</p>}{item.descricao && (item.inscricao || item.aluno) && <p className="text-xs text-muted-foreground">{item.descricao}</p>}{item.estorno_de_id && <p className="text-xs text-muted-foreground">Devolução vinculada</p>}</TableCell>
        <TableCell className="text-xs">{atividadeNome(item)}</TableCell>
        <TableCell className="text-xs">{item.unidade ? UNIDADE_LABELS[item.unidade] ?? item.unidade : "Geral institucional"}</TableCell>
        <TableCell className="text-xs">{item.categoria?.nome ?? "—"}{item.finalidade && <p>{finalidadeLabel[item.finalidade] ?? item.finalidade}</p>}{item.finalidade === "mensalidade" && <p>Referência: {item.mes_referencia?.slice(0, 7) ?? "desconhecida"}</p>}</TableCell>
        <TableCell className="text-xs"><Badge variant="outline">{item.origem === "legado" ? "Importado" : item.origem === "estorno" ? "Devolução" : "Central"}</Badge>{item.conciliacao_status !== "conciliado" && <p className="mt-1 text-amber-700">{item.conciliacao_status}</p>}{item.comprovante_url && <button className="mt-1 block underline" onClick={() => void abrirComprovante(item.comprovante_url!)}>Comprovante</button>}</TableCell>
        <TableCell className="text-right font-semibold text-green-700">{item.tipo === "entrada" ? formatBRL(Number(item.valor)) : ""}</TableCell>
        <TableCell className="text-right font-semibold text-red-700">{item.tipo === "saida" ? formatBRL(Number(item.valor)) : ""}</TableCell>
        <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Editar movimento ${item.id}`} title="Editar" onClick={() => abrirEdicao(item)}><Pencil className="h-4 w-4" /></Button>{disponivel > 0 && <Button variant="ghost" size="icon" aria-label={`Devolver movimento ${item.id}`} title="Registrar devolução" onClick={() => abrirDevolucao(item)}><RotateCcw className="h-4 w-4" /></Button>}</div></TableCell>
      </TableRow>; })}
    </TableBody></Table></CardContent></Card>
    <LancamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} lancamento={editando} />
    <Dialog open={Boolean(devolvendo)} onOpenChange={(open) => !open && setDevolvendo(null)}><DialogContent><DialogHeader><DialogTitle>Registrar devolução real</DialogTitle></DialogHeader><form className="space-y-3" onSubmit={registrarDevolucao}><p className="text-sm text-muted-foreground">A entrada original permanece no caixa. Será criada uma saída na data informada.</p><div><Label htmlFor="dev-valor">Valor (R$)</Label><Input id="dev-valor" value={valorDevolucao} onChange={(e) => setValorDevolucao(e.target.value)} inputMode="decimal" required />{devolvendo && <p className="text-xs text-muted-foreground">Disponível: {formatBRL(Number(devolvendo.valor) - totalDevolvido(devolvendo.id))}</p>}</div><div><Label htmlFor="dev-data">Data da devolução</Label><Input id="dev-data" type="date" value={dataDevolucao} onChange={(e) => setDataDevolucao(e.target.value)} required /></div><div><Label htmlFor="dev-categoria">Categoria de saída</Label><select id="dev-categoria" className="h-10 w-full rounded-md border bg-background px-3" value={categoriaDevolucao} onChange={(e) => setCategoriaDevolucao(e.target.value)} required><option value="">Selecione</option>{categorias.filter((item) => item.tipo === "saida" && item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div><div><Label htmlFor="dev-observacao">Observação</Label><Input id="dev-observacao" value={observacaoDevolucao} onChange={(e) => setObservacaoDevolucao(e.target.value)} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDevolvendo(null)}>Cancelar</Button><Button disabled={devolver.isPending}>{devolver.isPending ? "Registrando..." : "Registrar saída"}</Button></div></form></DialogContent></Dialog>
  </div>;
};

export default LancamentosTab;
