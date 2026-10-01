import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Pencil, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCategorias, useSalvarCategoria, type Categoria } from "@/features/financeiro/api";
import { getErrorCode, getErrorMessage } from "@/shared/lib/errors";

const CategoriasTab = () => {
  const { toast } = useToast();
  const { data: categorias = [], isLoading } = useCategorias();
  const salvarCategoria = useSalvarCategoria();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [ativo, setAtivo] = useState(true);

  const abrirDialog = (cat: Categoria | null) => {
    setEditando(cat);
    setNome(cat?.nome ?? "");
    setTipo((cat?.tipo as "entrada" | "saida") ?? "entrada");
    setAtivo(cat?.ativo ?? true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (nome.trim().length < 2) {
      toast({ title: "Informe o nome da categoria.", variant: "destructive" });
      return;
    }
    try {
      const payload = { nome: nome.trim(), tipo, ativo };
      await salvarCategoria.mutateAsync({ id: editando?.id, values: payload });
      toast({ title: editando ? "Categoria atualizada!" : "Categoria criada!" });
      setDialogOpen(false);
    } catch (error: unknown) {
      const msg = getErrorCode(error) === "23505"
        ? "Já existe uma categoria com este nome e tipo."
        : getErrorMessage(error);
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Categorias inativas não aparecem em novos lançamentos, mas o histórico permanece.
        </p>
        <Button onClick={() => abrirDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((c) => (
                <TableRow key={c.id} className={!c.ativo ? "opacity-60" : undefined}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    {c.tipo === "entrada" ? (
                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                        <ArrowUpCircle className="mr-1 h-3 w-3" /> Entrada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
                        <ArrowDownCircle className="mr-1 h-3 w-3" /> Saída
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.ativo ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-gray-50 text-gray-500"}>
                      {c.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirDialog(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "saida")} disabled={!!editando}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
              {editando && (
                <p className="text-xs text-muted-foreground">
                  O tipo não pode ser alterado: os lançamentos existentes dependem dele.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              Categoria ativa
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={salvarCategoria.isPending}>Cancelar</Button>
            <Button onClick={handleSave} disabled={salvarCategoria.isPending}>
              {salvarCategoria.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editando ? "Salvar alterações" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriasTab;
