import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useEdicoesSimposio } from "@/modules/atividades/api";
import { ITENS_SIMPOSIO_KEY, salvarDoacaoSimposio, useItensSimposio, type ItemSimposio } from "@/modules/atividades/api/itensSimposio";

const OperacaoSimposioPage = () => {
  const { edicaoId = "" } = useParams();
  const { data: edicoes = [] } = useEdicoesSimposio();
  const { data: itens = [], isLoading, error } = useItensSimposio(edicaoId);
  const client = useQueryClient();
  const { toast } = useToast();
  const [edicao, setEdicao] = useState<ItemSimposio | "nova" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [situacao, setSituacao] = useState("prometida");
  const evento = edicoes.find(e => e.id === edicaoId);
  const doacoes = itens.filter(i => i.tipo === "doacao_bem_servico");
  const origem = itens.filter(i => i.tipo !== "doacao_bem_servico");

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const quantidade = Number(f.get("quantidade"));
    const unidade = String(f.get("unidade") ?? "").trim();
    if (!Number.isFinite(quantidade) || quantidade <= 0 || !unidade) {
      toast({ title: "Informe quantidade e unidade válidas", variant: "destructive" }); return;
    }
    setSalvando(true);
    try {
      await salvarDoacaoSimposio(edicaoId, {
        descricao: String(f.get("descricao") ?? "").trim(),
        doador: String(f.get("doador") ?? "").trim() || null,
        quantidade, unidade_medida: unidade,
        data_recebimento: situacao === "recebida" ? String(f.get("data") ?? "") || null : null,
        situacao_doacao: situacao as "prometida" | "recebida",
      }, edicao === "nova" ? undefined : edicao?.id);
      await client.invalidateQueries({ queryKey: [...ITENS_SIMPOSIO_KEY, edicaoId] });
      setEdicao(null); toast({ title: "Inventário atualizado" });
    } catch (e) { toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSalvando(false); }
  }
  return <div className="container space-y-6 py-8"><Link to="/painel/instituto" className="text-sm underline">Voltar ao Instituto</Link>
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Operação do Simpósio · {evento?.nome ?? "Edição"}</h1><p className="text-sm text-muted-foreground">Inventário de bens e serviços e fonte histórica da edição. Entradas e saídas de caixa são registradas em Financeiro.</p></div><Button onClick={() => { setSituacao("prometida"); setEdicao("nova"); }}>Nova doação</Button></div>
    {error && <p className="text-destructive">Não foi possível carregar o inventário.</p>}{isLoading && <p>Carregando...</p>}
    <Card><CardHeader><CardTitle>Doações de bens e serviços</CardTitle></CardHeader><CardContent className="space-y-2">{doacoes.length === 0 && <p className="text-muted-foreground">Nenhuma doação registrada.</p>}{doacoes.map(i => <div key={i.id} className="flex flex-wrap justify-between gap-2 rounded border p-3 text-sm"><div><strong>{i.descricao}</strong><p>{i.doador ? `Doador: ${i.doador}` : "Doador desconhecido"} · {i.quantidade != null ? `${i.quantidade} ${i.unidade_medida ?? ""}` : "Quantidade desconhecida"}</p><p className="text-muted-foreground">{i.situacao_doacao === "recebida" ? "Recebida" : i.situacao_doacao === "prometida" ? "Prometida" : "Situação desconhecida"} · Data: {i.data_recebimento ?? "desconhecida"}{i.origem_referencia ? ` · Origem: ${i.origem_referencia}` : ""}</p></div><Button variant="outline" size="sm" onClick={() => { setSituacao(i.situacao_doacao ?? "prometida"); setEdicao(i); }}>Corrigir</Button></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Detalhes financeiros da planilha</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p className="text-muted-foreground">Fonte histórica para conciliação. Estes itens não criam movimentos de caixa.</p>{origem.length === 0 && <p>Sem itens financeiros de origem.</p>}{origem.map(i => <div key={i.id} className="flex flex-wrap justify-between gap-2 rounded border p-3"><span>{i.descricao} <Badge variant="outline">{i.tipo === "receita_detalhe" ? "Entrada na planilha" : "Saída na planilha"}</Badge><small className="block text-muted-foreground">{i.origem_referencia ?? "Origem não informada"}</small></span><strong>{i.valor == null ? "Valor desconhecido" : formatBRL(Number(i.valor))}</strong></div>)}</CardContent></Card>
    <Dialog open={!!edicao} onOpenChange={v => !v && setEdicao(null)}><DialogContent><DialogHeader><DialogTitle>{edicao === "nova" ? "Nova doação" : "Corrigir doação"}</DialogTitle></DialogHeader><form key={edicao === "nova" ? "nova" : edicao?.id} onSubmit={salvar} className="space-y-3">
      <Label>Bem ou serviço<Input name="descricao" defaultValue={edicao === "nova" ? "" : edicao?.descricao} required /></Label>
      <Label>Doador<Input name="doador" defaultValue={edicao === "nova" ? "" : edicao?.doador ?? ""} /></Label>
      <div className="grid grid-cols-2 gap-2"><Label>Quantidade<Input name="quantidade" type="number" min="0.01" step="0.01" defaultValue={edicao === "nova" ? "" : edicao?.quantidade ?? ""} required /></Label><Label>Unidade<Input name="unidade" placeholder="unidade, hora, kg..." defaultValue={edicao === "nova" ? "" : edicao?.unidade_medida ?? ""} required /></Label></div>
      <Label>Situação<select className="h-10 w-full rounded border bg-background px-2" value={situacao} onChange={e => setSituacao(e.target.value)}><option value="prometida">Prometida</option><option value="recebida">Recebida</option></select></Label>
      {situacao === "recebida" && <Label>Data de recebimento (se conhecida)<Input name="data" type="date" defaultValue={edicao === "nova" ? "" : edicao?.data_recebimento ?? ""} /></Label>}
      <Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
    </form></DialogContent></Dialog>
  </div>;
};
export default OperacaoSimposioPage;
