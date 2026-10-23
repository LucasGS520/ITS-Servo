import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Card, CardContent } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Switch } from "@/common/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { useNucleos, useSalvarNucleo, type Nucleo } from "@/modules/instituto/api";

const SEDE_SLUG = "sede_jd_santa_monica";
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function NucleosTab() {
  const { toast } = useToast();
  const { data: nucleos = [], isLoading } = useNucleos();
  const salvarNucleo = useSalvarNucleo();
  const [editando, setEditando] = useState<Nucleo | null>(null);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("SP");
  const [endereco, setEndereco] = useState("");
  const [ativo, setAtivo] = useState(true);

  const abrir = (item: Nucleo | null) => {
    setEditando(item);
    setNome(item?.nome ?? "");
    setCidade(item?.cidade ?? "");
    setUf(item?.uf ?? "SP");
    setEndereco(item?.endereco ?? "");
    setAtivo(item?.ativo ?? true);
    setAberto(true);
  };

  const salvar = async () => {
    if (!nome.trim() || !cidade.trim() || uf.trim().length !== 2 || (endereco.trim() && endereco.trim().length < 5)) return;
    try {
      await salvarNucleo.mutateAsync({ id: editando?.id, values: {
        slug: editando?.slug ?? slugify(nome), nome: nome.trim(), cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(), endereco: editando?.slug === SEDE_SLUG ? null : endereco.trim() || null, ativo,
      } });
      toast({ title: editando ? "Núcleo atualizado" : "Núcleo criado" });
      setAberto(false);
    } catch (error) {
      toast({ title: "Não foi possível salvar", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return <div className="space-y-4">
    <div className="flex justify-end"><Button onClick={() => abrir(null)}><Plus className="mr-2 h-4 w-4" />Novo núcleo</Button></div>
    <Card><CardContent className="p-0"><Table>
      <TableHeader><TableRow><TableHead>Núcleo</TableHead><TableHead>Cidade / UF</TableHead><TableHead>Endereço do relatório</TableHead><TableHead>Situação</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>{nucleos.map(n => <TableRow key={n.id}>
        <TableCell><p className="font-medium">{n.nome}</p><p className="font-mono text-xs text-muted-foreground">{n.slug}</p></TableCell>
        <TableCell>{n.cidade}/{n.uf}</TableCell>
        <TableCell>{n.slug === SEDE_SLUG ? <Link className="underline" to="/painel/instituto?secao=relatorios">Usa endereço da Sede</Link> : n.endereco ?? <span className="text-muted-foreground">Não configurado</span>}</TableCell>
        <TableCell>{n.ativo ? "Ativo" : "Inativo"}</TableCell>
        <TableCell><Button variant="ghost" size="icon" onClick={() => abrir(n)} aria-label={`Editar ${n.nome}`}><Pencil className="h-4 w-4" /></Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></CardContent></Card>
    <Dialog open={aberto} onOpenChange={setAberto}><DialogContent><DialogHeader><DialogTitle>{editando ? "Editar núcleo" : "Novo núcleo"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div><Label htmlFor="nucleo-nome">Nome</Label><Input id="nucleo-nome" value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><Label htmlFor="nucleo-cidade">Cidade</Label><Input id="nucleo-cidade" value={cidade} onChange={e => setCidade(e.target.value)} /></div>
        <div><Label htmlFor="nucleo-uf">UF</Label><Input id="nucleo-uf" maxLength={2} value={uf} onChange={e => setUf(e.target.value)} /></div>
        {editando?.slug === SEDE_SLUG ? <p className="text-sm">O endereço da Sede é configurado em <Link className="underline" to="/painel/instituto?secao=relatorios">Dados para relatórios</Link>.</p> : <div>
          <Label htmlFor="nucleo-endereco">Endereço para relatórios</Label>
          <Input id="nucleo-endereco" maxLength={240} value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade e UF" />
          <p className="text-xs text-muted-foreground">Obrigatório para imprimir relatórios deste núcleo.</p>
        </div>}
        <label className="flex items-center gap-2 text-sm"><Switch checked={ativo} onCheckedChange={setAtivo} />Núcleo ativo</label>
        <p className="text-xs text-muted-foreground">Núcleos nunca são apagados para preservar o histórico.</p>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button><Button onClick={salvar} disabled={salvarNucleo.isPending || (!!endereco.trim() && endereco.trim().length < 5)}>Salvar</Button></div>
      </div>
    </DialogContent></Dialog></div>;
}
