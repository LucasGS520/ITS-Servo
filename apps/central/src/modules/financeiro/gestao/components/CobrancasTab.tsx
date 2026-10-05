import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { useToast } from "@/common/hooks/use-toast";
import { formatBRL } from "@/common/constants/pricing";
import { getErrorMessage } from "@/common/lib/errors";
import { obterUrlComprovante, useMatriculas } from "@/modules/matriculas";
import { useParticipantesComHistorico } from "@/modules/participantes";
import {
  useCategorias,
  useCobrancas,
  useConciliarPagamento,
  useEstornarPagamento,
  usePagamentos,
  useRecusarPagamento,
  useSalvarCobranca,
  type Cobranca,
} from "@/modules/financeiro";
import { ExternalLink, Loader2, Pencil, Plus, RotateCcw, XCircle } from "lucide-react";

const CobrancasTab = () => {
  const { toast } = useToast();
  const { data: cobrancas = [] } = useCobrancas();
  const { data: pagamentos = [] } = usePagamentos();
  const { data: pessoasData } = useParticipantesComHistorico();
  const { data: categorias = [] } = useCategorias();
  const { data: matriculas = [] } = useMatriculas();
  const conciliar = useConciliarPagamento();
  const recusar = useRecusarPagamento();
  const estornar = useEstornarPagamento();
  const salvarCobranca = useSalvarCobranca();
  const [edicao, setEdicao] = useState<Cobranca | "nova" | null>(null);
  const [pessoaId, setPessoaId] = useState("");

  const saldos = useMemo(() => new Map(cobrancas.map((cobranca) => {
    const pago = pagamentos
      .filter((pagamento) => pagamento.cobranca_id === cobranca.id && pagamento.status === "conciliado")
      .reduce((total, pagamento) => total + Number(pagamento.valor ?? 0), 0);
    return [cobranca.id, Number(cobranca.valor_devido) - pago];
  })), [cobrancas, pagamentos]);

  const pessoas = pessoasData?.pessoas ?? [];
  const pendentes = pagamentos.filter((pagamento) => pagamento.status === "pendente");
  const conciliados = pagamentos.filter((pagamento) => pagamento.status === "conciliado");

  const confirmar = async (pagamentoId: string, cobrancaId: string | null) => {
    const saldo = cobrancaId ? saldos.get(cobrancaId) ?? 0 : 0;
    const texto = window.prompt("Valor efetivamente recebido (R$):", saldo ? String(saldo).replace(".", ",") : "");
    if (!texto) return;
    const valor = Number(texto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      toast({ title: "Informe um valor válido.", variant: "destructive" });
      return;
    }
    try {
      await conciliar.mutateAsync({ id: pagamentoId, valor });
      toast({ title: saldo === valor ? "Pagamento conciliado e matrícula confirmada" : "Pagamento parcial conciliado" });
    } catch (erro) {
      toast({ title: "Não foi possível conciliar", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  const rejeitar = async (pagamentoId: string) => {
    const motivo = window.prompt("Motivo da recusa do comprovante:");
    if (!motivo?.trim()) return;
    try {
      await recusar.mutateAsync({ id: pagamentoId, motivo });
      toast({ title: "Comprovante recusado" });
    } catch (erro) {
      toast({ title: "Não foi possível recusar", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  const estornarRecebimento = async (pagamentoId: string) => {
    const motivo = window.prompt("Motivo do estorno do pagamento:");
    if (!motivo?.trim()) return;
    try {
      await estornar.mutateAsync({ id: pagamentoId, motivo });
      toast({ title: "Pagamento estornado", description: "Cobrança e matrícula foram recalculadas." });
    } catch (erro) {
      toast({ title: "Não foi possível estornar", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  const abrirComprovante = async (path: string | null) => {
    if (!path) return;
    try {
      const url = await obterUrlComprovante(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (erro) {
      toast({ title: "Não foi possível abrir", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  const abrirEdicao = (item: Cobranca | "nova") => {
    setEdicao(item);
    setPessoaId(item === "nova" ? "" : item.pessoa_id);
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await salvarCobranca.mutateAsync({
        id: edicao === "nova" ? undefined : edicao?.id,
        values: {
          pessoa_id: pessoaId,
          inscricao_id: String(form.get("inscricao_id") ?? "") || null,
          categoria_id: String(form.get("categoria_id") ?? "") || null,
          referente: String(form.get("referente") ?? "").trim(),
          valor_devido: Number(form.get("valor_devido")),
          vencimento: String(form.get("vencimento") ?? "") || null,
          status: String(form.get("status") ?? "aberta"),
        },
      });
      toast({ title: edicao === "nova" ? "Cobrança criada" : "Cobrança atualizada" });
      setEdicao(null);
    } catch (erro) {
      toast({ title: "Não foi possível salvar", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  const atual = edicao === "nova" ? null : edicao;

  return <div className="space-y-6">
    <div className="flex justify-end"><Button onClick={() => abrirEdicao("nova")}><Plus className="mr-2 h-4 w-4" />Nova cobrança</Button></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Cobranças</CardTitle></CardHeader><CardContent className="space-y-3">
        {cobrancas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p> : cobrancas.map((cobranca) => <div key={cobranca.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{cobranca.referente}</p><p className="text-sm text-muted-foreground">Vencimento: {cobranca.vencimento ?? "não definido"}</p></div><div className="flex items-center gap-1"><Badge variant={cobranca.status === "quitada" ? "default" : "outline"}>{cobranca.status}</Badge><Button variant="ghost" size="sm" onClick={() => abrirEdicao(cobranca)}><Pencil className="h-4 w-4" /><span className="sr-only">Editar cobrança</span></Button></div></div>
          <p className="mt-2 text-sm">Saldo: <strong>{formatBRL(saldos.get(cobranca.id) ?? Number(cobranca.valor_devido))}</strong></p>
        </div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Comprovantes para conferência</CardTitle></CardHeader><CardContent className="space-y-3">
        {pendentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento aguardando conferência.</p> : pendentes.map((pagamento) => {
          const matricula = matriculas.find((item) => item.id === pagamento.inscricao_id);
          return <div key={pagamento.id} className="space-y-3 rounded-lg border p-3"><div><p className="font-medium">{matricula?.nome_completo ?? "Pagamento recebido"}</p><p className="text-sm text-muted-foreground">{matricula?.numero_inscricao ?? pagamento.created_at.slice(0, 10)}</p></div><div className="flex flex-wrap gap-2">{pagamento.comprovante_url && <Button size="sm" variant="outline" onClick={() => abrirComprovante(pagamento.comprovante_url)}><ExternalLink className="mr-2 h-4 w-4" />Comprovante</Button>}<Button size="sm" onClick={() => confirmar(pagamento.id, pagamento.cobranca_id)} disabled={conciliar.isPending}>Conciliar</Button><Button size="sm" variant="destructive" onClick={() => rejeitar(pagamento.id)} disabled={recusar.isPending}><XCircle className="mr-2 h-4 w-4" />Recusar</Button></div></div>;
        })}
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Pagamentos conciliados</CardTitle></CardHeader><CardContent className="space-y-3">
      {conciliados.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento conciliado.</p> : conciliados.map((pagamento) => <div key={pagamento.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{formatBRL(Number(pagamento.valor ?? 0))}</p><p className="text-sm text-muted-foreground">Recebido em {pagamento.data_recebimento ?? "data não informada"}</p></div><Button size="sm" variant="outline" onClick={() => estornarRecebimento(pagamento.id)} disabled={estornar.isPending}><RotateCcw className="mr-2 h-4 w-4" />Estornar</Button></div>)}
    </CardContent></Card>

    <Dialog open={Boolean(edicao)} onOpenChange={(aberto) => !aberto && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>{edicao === "nova" ? "Nova cobrança" : "Editar cobrança"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={salvar}>
      <div className="space-y-1"><Label>Participante</Label><Select value={pessoaId} onValueChange={setPessoaId} required><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{pessoas.map((pessoa) => <SelectItem key={pessoa.id} value={pessoa.id}>{pessoa.nome_completo}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label htmlFor="cobranca-inscricao">Matrícula relacionada</Label><select id="cobranca-inscricao" name="inscricao_id" defaultValue={atual?.inscricao_id ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Cobrança avulsa</option>{matriculas.filter((item) => !pessoaId || item.pessoa_id === pessoaId).map((item) => <option key={item.id} value={item.id}>{item.numero_inscricao} — {item.nome_completo}</option>)}</select></div>
      <div className="space-y-1"><Label htmlFor="cobranca-referente">Referência</Label><Input id="cobranca-referente" name="referente" defaultValue={atual?.referente ?? ""} required /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="cobranca-valor">Valor devido</Label><Input id="cobranca-valor" name="valor_devido" type="number" min="0.01" step="0.01" defaultValue={atual?.valor_devido ?? ""} required /></div><div className="space-y-1"><Label htmlFor="cobranca-vencimento">Vencimento</Label><Input id="cobranca-vencimento" name="vencimento" type="date" defaultValue={atual?.vencimento ?? ""} /></div></div>
      <div className="space-y-1"><Label htmlFor="cobranca-categoria">Categoria</Label><select id="cobranca-categoria" name="categoria_id" defaultValue={atual?.categoria_id ?? ""} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Selecione</option>{categorias.filter((categoria) => categoria.tipo === "entrada" && categoria.ativo).map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></div>
      <div className="space-y-1"><Label htmlFor="cobranca-status">Status</Label><select id="cobranca-status" name="status" defaultValue={atual?.status === "cancelada" ? "cancelada" : "aberta"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="aberta">Aberta</option><option value="cancelada">Cancelada</option></select></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEdicao(null)}>Cancelar</Button><Button disabled={salvarCobranca.isPending || !pessoaId}>{salvarCobranca.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></div>
    </form></DialogContent></Dialog>
  </div>;
};

export default CobrancasTab;
