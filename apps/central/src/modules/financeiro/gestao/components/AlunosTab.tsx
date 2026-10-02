import { useMemo, useState } from "react";
import { Card, CardContent } from "@/common/ui/card";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Badge } from "@/common/ui/badge";
import { Textarea } from "@/common/ui/textarea";
import { Switch } from "@/common/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Loader2, Pencil, Plus, Search, UserRound } from "lucide-react";
import { useToast } from "@/common/hooks/use-toast";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import { useAlunos, useSalvarAluno, type Aluno } from "@/modules/financeiro/api";
import { getErrorMessage } from "@/common/lib/errors";

const AlunosTab = () => {
  const { toast } = useToast();
  const { data: alunos = [], isLoading } = useAlunos();
  const salvarAluno = useSalvarAluno();

  const [filtroUnidade, setFiltroUnidade] = useState("todas");
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Aluno | null>(null);
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativo, setAtivo] = useState(true);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos.filter((a) => {
      if (!mostrarInativos && !a.ativo) return false;
      if (filtroUnidade !== "todas" && a.unidade !== filtroUnidade) return false;
      if (termo && !a.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [alunos, filtroUnidade, busca, mostrarInativos]);

  const abrirDialog = (aluno: Aluno | null) => {
    setEditando(aluno);
    setNome(aluno?.nome ?? "");
    setUnidade(aluno?.unidade ?? "");
    setObservacoes(aluno?.observacoes ?? "");
    setAtivo(aluno?.ativo ?? true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (nome.trim().length < 2) {
      toast({ title: "Informe o nome do aluno.", variant: "destructive" });
      return;
    }
    if (!unidade) {
      toast({ title: "Selecione a unidade.", variant: "destructive" });
      return;
    }
    try {
      const payload = { nome: nome.trim(), unidade, observacoes: observacoes.trim() || null, ativo };
      await salvarAluno.mutateAsync({ id: editando?.id, values: payload });
      toast({ title: editando ? "Aluno atualizado!" : "Aluno cadastrado!" });
      setDialogOpen(false);
    } catch (error: unknown) {
      toast({ title: "Erro ao salvar", description: getErrorMessage(error), variant: "destructive" });
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
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Unidade</p>
          <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {UNIDADES_FINANCEIRO.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-48 flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Buscar</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Nome…" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
          </div>
        </div>
        <label className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={mostrarInativos} onCheckedChange={setMostrarInativos} />
          Mostrar inativos
        </label>
        <Button onClick={() => abrirDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Novo aluno
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhum aluno com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map((a) => (
                    <TableRow key={a.id} className={!a.ativo ? "opacity-60" : undefined}>
                      <TableCell className="font-medium">
                        {a.nome}
                        {a.observacoes && (
                          <p className="text-xs font-normal text-muted-foreground">{a.observacoes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {UNIDADE_LABELS[a.unidade] ?? a.unidade}
                      </TableCell>
                      <TableCell>
                        {a.inscricao_id ? (
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                            <UserRound className="mr-1 h-3 w-3" /> Via inscrição
                          </Badge>
                        ) : (
                          <Badge variant="outline">Cadastro manual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={a.ativo ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-500"}>
                          {a.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirDialog(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar aluno" : "Novo aluno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                <SelectContent>
                  {UNIDADES_FINANCEIRO.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              Aluno ativo
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvarAluno.isPending}>Cancelar</Button>
            <Button onClick={handleSave} disabled={salvarAluno.isPending}>
              {salvarAluno.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editando ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlunosTab;
