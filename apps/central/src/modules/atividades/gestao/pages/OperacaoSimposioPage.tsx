import { useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useEdicoesSimposio, useSalvarEdicaoSimposio } from "@/modules/atividades/api";
import { ITENS_SIMPOSIO_KEY, salvarDoacaoSimposio, useItensSimposio, type ItemSimposio } from "@/modules/atividades/api/itensSimposio";
import { useMatriculas } from "@/modules/matriculas/api";
import { FichaInscricaoDialog } from "@/modules/matriculas/gestao/pages/FichaInscricaoDialog";
import { NovaInscricaoDialog } from "@/modules/matriculas/gestao/pages/NovaInscricaoDialog";

const OperacaoSimposioPage = () => {
  const { edicaoId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const aba = params.get("aba") ?? "visao";
  const { data: edicoes = [], isLoading: carregandoEdicoes } = useEdicoesSimposio();
  const { data: inscricoes = [] } = useMatriculas();
  const { data: itens = [], error: erroItens } = useItensSimposio(edicaoId);
  const salvarEdicao = useSalvarEdicaoSimposio();
  const client = useQueryClient();
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [doacao, setDoacao] = useState<ItemSimposio | "nova" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [situacao, setSituacao] = useState("prometida");
  const [novaInscricao, setNovaInscricao] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<string | null>(null);
  const evento = edicoes.find(e => e.id === edicaoId);
  const lista = inscricoes.filter(i => i.edicao_simposio_id === edicaoId);
  const emAnalise = lista.filter(i => ["em_analise", "comprovante_enviado", "pagamento_nao_identificado"].includes(i.status));
  const confirmados = lista.filter(i => i.status === "confirmada");
  const cancelados = lista.filter(i => i.status === "cancelado");
  const doacoes = itens.filter(i => i.tipo === "doacao_bem_servico");
  const fonte = itens.filter(i => i.tipo !== "doacao_bem_servico");

  async function salvarConfiguracao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evento) return;
    const f = new FormData(event.currentTarget);
    const inicio = String(f.get("inicio") ?? "") || null;
    const fim = String(f.get("fim") ?? "") || null;
    const valor = f.get("valor") ? Number(f.get("valor")) : null;
    const publico = f.get("publico") === "on";
    const ativo = f.get("ativo") === "on";
    if (inicio && fim && fim < inicio) { toast({ title: "Fim anterior ao início", variant: "destructive" }); return; }
    if (publico && (!ativo || valor == null)) { toast({ title: "Ative a edição e informe o preço antes de publicar", variant: "destructive" }); return; }
    try {
      await salvarEdicao.mutateAsync({ id: evento.id, values: { nome: String(f.get("nome") ?? "").trim(), inicio, fim, valor, ativo, publico } });
      setEditando(false); toast({ title: "Edição atualizada" });
    } catch (e) { toast({ title: "Não foi possível atualizar", description: getErrorMessage(e), variant: "destructive" }); }
  }
  async function encerrar() {
    if (!evento) return;
    try {
      await salvarEdicao.mutateAsync({ id: evento.id, values: { nome: evento.nome, inicio: evento.inicio, fim: evento.fim, valor: evento.valor, ativo: false, publico: false } });
      toast({ title: "Edição encerrada para novas inscrições" });
    } catch (e) { toast({ title: "Não foi possível encerrar", description: getErrorMessage(e), variant: "destructive" }); }
  }
  async function salvarDoacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const quantidade = Number(f.get("quantidade"));
    const unidade = String(f.get("unidade") ?? "").trim();
    if (!Number.isFinite(quantidade) || quantidade <= 0 || !unidade) { toast({ title: "Informe quantidade e unidade válidas", variant: "destructive" }); return; }
    setSalvando(true);
    try {
      await salvarDoacaoSimposio(edicaoId, {
        descricao: String(f.get("descricao") ?? "").trim(), doador: String(f.get("doador") ?? "").trim() || null,
        quantidade, unidade_medida: unidade,
        data_recebimento: situacao === "recebida" ? String(f.get("data") ?? "") || null : null,
        situacao_doacao: situacao as "prometida" | "recebida",
      }, doacao === "nova" ? undefined : doacao?.id);
      await client.invalidateQueries({ queryKey: [...ITENS_SIMPOSIO_KEY, edicaoId] });
      setDoacao(null); toast({ title: "Inventário atualizado" });
    } catch (e) { toast({ title: "Não foi possível salvar", description: getErrorMessage(e), variant: "destructive" }); }
    finally { setSalvando(false); }
  }
  if (!evento) return <div className="container space-y-3 py-8"><Link className="underline" to="/painel/instituto?secao=simposios">Voltar a Simpósios</Link><p>{carregandoEdicoes ? "Carregando edição..." : "Edição não encontrada."}</p></div>;
  return <div className="container space-y-6 py-8"><Link to="/painel/instituto?secao=simposios" className="text-sm underline">Instituto / Simpósios</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{evento.nome}</h1><p className="text-sm text-muted-foreground">Período: {evento.inicio ?? "não informado"}{evento.fim ? ` a ${evento.fim}` : ""} · Preço: {evento.valor == null ? "a configurar" : formatBRL(Number(evento.valor))}</p><div className="mt-2 flex gap-2"><Badge>{evento.ativo ? "Aberta para inscrições internas" : "Encerrada para novas inscrições"}</Badge><Badge variant="outline">{evento.publico ? "Publicada no Site" : "Interna"}</Badge></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditando(true)}>Configurar</Button>{evento.ativo && <Button variant="outline" onClick={() => void encerrar()} disabled={salvarEdicao.isPending}>Encerrar edição</Button>}</div></div>
    <Tabs value={aba} onValueChange={value => setParams({ aba: value })}><TabsList className="flex-wrap"><TabsTrigger value="visao">Visão geral</TabsTrigger><TabsTrigger value="inscricoes">Inscrições e participantes</TabsTrigger><TabsTrigger value="doacoes">Doações</TabsTrigger><TabsTrigger value="fonte">Fonte histórica</TabsTrigger></TabsList>
      <TabsContent value="visao" className="space-y-4 pt-4"><div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><strong>{evento.inscritos_historicos ?? "—"}</strong><p>Inscritos históricos agregados</p><small>{evento.pagantes_historicos ?? "—"} pagantes · {evento.isentos_historicos ?? "—"} isentos</small></CardContent></Card><Card><CardContent className="p-4"><strong>{emAnalise.length}</strong><p>Inscrições identificadas em análise</p></CardContent></Card><Card><CardContent className="p-4"><strong>{confirmados.length}</strong><p>Participantes identificados confirmados</p></CardContent></Card></div><p className="text-sm text-muted-foreground">{cancelados.length} inscrição(ões) cancelada(s). Os totais históricos não representam uma lista nominal.</p><div className="flex flex-wrap gap-2"><Button onClick={() => setParams({ aba: "inscricoes" })}>Ver inscrições</Button><Button asChild variant="outline"><Link to={`/painel/financeiro?tab=lancamentos&atividade=simposio:${edicaoId}`}>Ver movimentações</Link></Button><Button asChild variant="outline"><Link to={`/painel/relatorios?tab=simposios&edicao=${edicaoId}`}>Ver relatórios</Link></Button></div></TabsContent>
      <TabsContent value="inscricoes" className="space-y-4 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm">{emAnalise.length} em análise · {confirmados.length} confirmados · {cancelados.length} cancelados</p>{evento.ativo && <Button onClick={() => setNovaInscricao(true)}>Nova inscrição nesta edição</Button>}</div>
        {lista.length === 0 ? <p className="rounded border p-4 text-sm text-muted-foreground">Sem inscrições individuais. Os totais importados não contêm nomes.</p> : <div className="space-y-2">{lista.map(i => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><span><strong>{i.nome_completo}</strong><small className="block text-muted-foreground">{i.numero_inscricao} · {i.status} · {i.origem_cadastro}</small></span><Button variant="outline" size="sm" onClick={() => setInscricaoId(i.id)}>Abrir ficha</Button></div>)}</div>}
      </TabsContent>
      <TabsContent value="doacoes" className="space-y-4 pt-4"><div className="flex justify-between gap-2"><p className="text-sm text-muted-foreground">Bens e serviços não entram no caixa.</p><Button onClick={() => { setSituacao("prometida"); setDoacao("nova"); }}>Nova doação</Button></div>{erroItens && <p className="text-destructive">Falha ao carregar itens.</p>}{doacoes.map(i => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"><span><strong>{i.descricao}</strong><small className="block text-muted-foreground">{i.doador ?? "Doador desconhecido"} · {i.quantidade == null ? "Quantidade desconhecida" : `${i.quantidade} ${i.unidade_medida ?? ""}`} · {i.situacao_doacao ?? "situação desconhecida"} · {i.data_recebimento ?? "data desconhecida"}{i.origem_referencia ? ` · ${i.origem_referencia}` : ""}</small></span><Button variant="outline" size="sm" onClick={() => { setSituacao(i.situacao_doacao ?? "prometida"); setDoacao(i); }}>Corrigir</Button></div>)}</TabsContent>
      <TabsContent value="fonte" className="space-y-3 pt-4"><p className="text-sm text-muted-foreground">Detalhes financeiros originais para conciliação; não geram novos movimentos de caixa.</p>{erroItens && <p className="text-destructive">Falha ao carregar itens.</p>}{fonte.length === 0 && <p>Sem detalhes financeiros importados.</p>}{fonte.map(i => <div key={i.id} className="flex flex-wrap justify-between gap-2 rounded border p-3 text-sm"><span>{i.descricao} <Badge variant="outline">{i.tipo === "receita_detalhe" ? "Entrada da planilha" : "Saída da planilha"}</Badge><small className="block text-muted-foreground">{i.origem_referencia ?? "Origem desconhecida"}</small></span><strong>{i.valor == null ? "Valor desconhecido" : formatBRL(Number(i.valor))}</strong></div>)}</TabsContent>
    </Tabs>
    <Dialog open={editando} onOpenChange={setEditando}><DialogContent><DialogHeader><DialogTitle>Configurar edição</DialogTitle></DialogHeader><form key={evento.id} onSubmit={salvarConfiguracao} className="space-y-3"><Label>Nome<Input name="nome" defaultValue={evento.nome} required /></Label><div className="grid grid-cols-2 gap-2"><Label>Início<Input type="date" name="inicio" defaultValue={evento.inicio ?? ""} /></Label><Label>Fim<Input type="date" name="fim" defaultValue={evento.fim ?? ""} /></Label></div><Label>Preço único<Input type="number" min="0" step="0.01" name="valor" defaultValue={evento.valor ?? ""} /></Label><label className="flex gap-2"><input type="checkbox" name="ativo" defaultChecked={evento.ativo} />Aceitar novas inscrições internas</label><label className="flex gap-2"><input type="checkbox" name="publico" defaultChecked={evento.publico} />Publicado no Site</label><Button disabled={salvarEdicao.isPending}>Salvar</Button></form></DialogContent></Dialog>
    <Dialog open={!!doacao} onOpenChange={v => !v && setDoacao(null)}><DialogContent><DialogHeader><DialogTitle>{doacao === "nova" ? "Nova doação" : "Corrigir doação"}</DialogTitle></DialogHeader><form key={doacao === "nova" ? "nova" : doacao?.id} onSubmit={salvarDoacao} className="space-y-3"><Label>Bem ou serviço<Input name="descricao" defaultValue={doacao === "nova" ? "" : doacao?.descricao} required /></Label><Label>Doador<Input name="doador" defaultValue={doacao === "nova" ? "" : doacao?.doador ?? ""} /></Label><div className="grid grid-cols-2 gap-2"><Label>Quantidade<Input name="quantidade" type="number" min="0.01" step="0.01" defaultValue={doacao === "nova" ? "" : doacao?.quantidade ?? ""} required /></Label><Label>Unidade<Input name="unidade" defaultValue={doacao === "nova" ? "" : doacao?.unidade_medida ?? ""} required /></Label></div><Label>Situação<select className="h-10 w-full rounded border bg-background px-2" value={situacao} onChange={e => setSituacao(e.target.value)}><option value="prometida">Prometida</option><option value="recebida">Recebida</option></select></Label>{situacao === "recebida" && <Label>Data de recebimento (se conhecida)<Input name="data" type="date" defaultValue={doacao === "nova" ? "" : doacao?.data_recebimento ?? ""} /></Label>}<Button disabled={salvando}>Salvar</Button></form></DialogContent></Dialog>
    <NovaInscricaoDialog key={edicaoId} open={novaInscricao} onClose={() => setNovaInscricao(false)} atividadeInicial={`simposio:${edicaoId}`} onCreated={id => { setNovaInscricao(false); setInscricaoId(id); }} />
    <FichaInscricaoDialog inscricao={lista.find(i => i.id === inscricaoId) ?? null} onClose={() => setInscricaoId(null)} />
  </div>;
};
export default OperacaoSimposioPage;
