import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/shared/constants/pricing";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/features/financeiro/model/unidades";
import {
  useExcluirLancamento,
  useLancamentos,
  type Lancamento,
} from "@/features/financeiro/api";
import { formatData, mesParaCompetencia, saldoAcumulado, totaisDoMes } from "@/features/financeiro/model/agregados";
import LancamentoDialog from "./LancamentoDialog";
import { getErrorMessage } from "@/shared/lib/errors";

const LancamentosTab = () => {
  const { toast } = useToast();
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const excluirLancamento = useExcluirLancamento();

  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busca, setBusca] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [excluindo, setExcluindo] = useState<Lancamento | null>(null);

  const competencia = mesParaCompetencia(mes);

  const { totais, acumulado, linhas } = useMemo(() => {
    // Cards acompanham o filtro de unidade (senão o total geral parece ser o
    // da unidade selecionada). "todas" = tudo; "geral" = só institucionais.
    const escopo =
      filtroUnidade === "todas"
        ? lancamentos
        : lancamentos.filter((l) => (filtroUnidade === "geral" ? l.unidade === null : l.unidade === filtroUnidade));
    const totais = totaisDoMes(escopo, competencia);
    const acumulado = saldoAcumulado(escopo, competencia);
    const termo = busca.trim().toLowerCase();
    const linhas = lancamentos.filter((l) => {
      if (l.competencia !== competencia) return false;
      if (filtroUnidade === "geral" && l.unidade !== null) return false;
      if (filtroUnidade !== "todas" && filtroUnidade !== "geral" && l.unidade !== filtroUnidade) return false;
      if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
      if (termo) {
        const alvo = `${l.aluno?.nome ?? ""} ${l.descricao ?? ""} ${l.categoria?.nome ?? ""}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
    return { totais, acumulado, linhas };
  }, [lancamentos, competencia, filtroUnidade, filtroTipo, busca]);

  const handleDelete = async () => {
    if (!excluindo) return;
    try {
      await excluirLancamento.mutateAsync(excluindo.id);
      toast({ title: "Lançamento excluído." });
      setExcluindo(null);
    } catch (error: unknown) {
      toast({ title: "Erro ao excluir", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cards do mês ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-green-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Entrada do mês</p>
            </div>
            <p className="text-2xl font-bold text-green-800">{formatBRL(totais.entrada)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Saída do mês</p>
            </div>
            <p className="text-2xl font-bold text-red-800">{formatBRL(totais.saida)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo do mês</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatBRL(totais.saldo)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Saldo acumulado</p>
            </div>
            <p className="text-2xl font-bold text-primary">{formatBRL(acumulado)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Até o mês selecionado{filtroUnidade !== "todas" ? " (unidade filtrada)" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros + ações ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Mês</p>
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Unidade</p>
          <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="geral">Geral (institucional)</SelectItem>
              {UNIDADES_FINANCEIRO.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Tipo</p>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-48 flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Buscar</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Aluno, categoria ou descrição…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => { setEditando(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo lançamento
        </Button>
      </div>

      {/* ── Tabela ── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno / Descrição</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nenhum lançamento neste mês com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm text-muted-foreground">{formatData(l.data)}</TableCell>
                      <TableCell className="font-medium">
                        {l.aluno?.nome ?? l.descricao ?? l.categoria?.nome ?? "—"}
                        {l.aluno && l.descricao && (
                          <p className="text-xs font-normal text-muted-foreground">{l.descricao}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.unidade ? UNIDADE_LABELS[l.unidade] ?? l.unidade : <Badge variant="outline">Geral</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.categoria?.nome ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-700">
                        {l.tipo === "entrada" ? formatBRL(Number(l.valor)) : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-red-700">
                        {l.tipo === "saida" ? formatBRL(Number(l.valor)) : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" title="Editar"
                            onClick={() => { setEditando(l); setDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Excluir" onClick={() => setExcluindo(l)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LancamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} lancamento={editando} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluindo && (
                <>Será excluído: <strong>{excluindo.aluno?.nome ?? excluindo.descricao ?? excluindo.categoria?.nome}</strong> — {formatBRL(Number(excluindo.valor))} ({excluindo.tipo}). Esta ação não pode ser desfeita.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirLancamento.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={excluirLancamento.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {excluirLancamento.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LancamentosTab;
