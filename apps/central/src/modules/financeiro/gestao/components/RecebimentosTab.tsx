import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import { formatBRL } from "@/common/constants/pricing";
import { useMatriculas, obterUrlComprovante } from "@/modules/matriculas";
import { useAlunos } from "@/modules/financeiro/api";
import { ATRIBUICOES_KEY, RECEBIMENTOS_ITS_KEY, atribuirMensalidadeIts, retirarAtribuicaoIts, estornarRecebimentoIts, registrarRecebimentoIts, useAtribuicoesMensalidade, useRecebimentosIts } from "@/modules/financeiro/api/its";

const hoje = () => new Date().toISOString().slice(0, 10);
const mes = () => hoje().slice(0, 7);

const RecebimentosTab = () => {
  const { toast } = useToast();
  const client = useQueryClient();
  const { data: inscricoes = [] } = useMatriculas();
  const { data: alunos = [] } = useAlunos();
  const { data: recebimentos = [] } = useRecebimentosIts();
  const { data: atribuicoes = [] } = useAtribuicoesMensalidade();
  const [inscricaoId, setInscricaoId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje);
  const [tipo, setTipo] = useState("mensalidade");
  const [parcelas, setParcelas] = useState([{ competencia: mes(), valor: "" }]);
  const [salvando, setSalvando] = useState(false);
  const inscricao = inscricoes.find((i) => i.id === inscricaoId);
  const aluno = alunos.find((a) => a.inscricao_id === inscricaoId);

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    const total = Number(valor.replace(",", "."));
    const alocacoes = tipo === "mensalidade" ? parcelas.filter((p) => p.valor).map((p) => ({ competencia: `${p.competencia}-01`, valor: Number(p.valor.replace(",", ".")) })) : [];
    if (!inscricaoId || !Number.isFinite(total) || total <= 0 || !data || alocacoes.some((p) => !Number.isFinite(p.valor) || p.valor <= 0)) {
      toast({ title: "Confira inscrição, valor, data e competências", variant: "destructive" }); return;
    }
    if (alocacoes.reduce((s, a) => s + a.valor, 0) > total + 0.001) {
      toast({ title: "As atribuições excedem o valor recebido", variant: "destructive" }); return;
    }
    setSalvando(true);
    try {
      await registrarRecebimentoIts({ inscricaoId, valor: total, data, tipo, atribuicoes: alocacoes, comprovante: inscricao?.comprovante_url });
      await Promise.all([client.invalidateQueries({ queryKey: RECEBIMENTOS_ITS_KEY }), client.invalidateQueries({ queryKey: ATRIBUICOES_KEY }), client.invalidateQueries({ queryKey: ["lancamentos_financeiros"] })]);
      setValor(""); setParcelas([{ competencia: mes(), valor: "" }]);
      toast({ title: "Recebimento registrado no caixa" });
    } catch (error) { toast({ title: "Não foi possível registrar", description: getErrorMessage(error), variant: "destructive" }); }
    finally { setSalvando(false); }
  };

  const estornar = async (id: string) => {
    const motivo = window.prompt("Motivo do estorno:");
    if (!motivo?.trim()) return;
    try {
      await estornarRecebimentoIts(id, motivo);
      await Promise.all([client.invalidateQueries({ queryKey: RECEBIMENTOS_ITS_KEY }), client.invalidateQueries({ queryKey: ATRIBUICOES_KEY }), client.invalidateQueries({ queryKey: ["lancamentos_financeiros"] })]);
      toast({ title: "Recebimento estornado" });
    } catch (error) { toast({ title: "Falha no estorno", description: getErrorMessage(error), variant: "destructive" }); }
  };

  const abrirComprovante = async () => {
    if (!inscricao?.comprovante_url) return;
    try { window.open(await obterUrlComprovante(inscricao.comprovante_url), "_blank", "noopener,noreferrer"); }
    catch (error) { toast({ title: "Falha ao abrir comprovante", description: getErrorMessage(error), variant: "destructive" }); }
  };

  const atribuir = async (id: string) => {
    const referencia = window.prompt("Mês da mensalidade (AAAA-MM):");
    const valorTexto = window.prompt("Valor atribuído (R$):");
    if (!referencia || !/^\d{4}-(0[1-9]|1[0-2])$/.test(referencia) || !valorTexto) return;
    const valorAtribuido = Number(valorTexto.replace(",", "."));
    if (!Number.isFinite(valorAtribuido) || valorAtribuido <= 0) return;
    try { await atribuirMensalidadeIts(id, `${referencia}-01`, valorAtribuido); await client.invalidateQueries({ queryKey: ATRIBUICOES_KEY }); toast({ title: "Mensalidade atribuída" }); }
    catch (error) { toast({ title: "Não foi possível atribuir", description: getErrorMessage(error), variant: "destructive" }); }
  };

  const retirar = async (id: string) => {
    const motivo = window.prompt("Motivo da correção:"); if (!motivo?.trim()) return;
    try { await retirarAtribuicaoIts(id, motivo); await client.invalidateQueries({ queryKey: ATRIBUICOES_KEY }); toast({ title: "Atribuição corrigida" }); }
    catch (error) { toast({ title: "Não foi possível corrigir", description: getErrorMessage(error), variant: "destructive" }); }
  };

  return <div className="grid gap-6 lg:grid-cols-2">
    <Card><CardHeader><CardTitle>Registrar recebimento conferido</CardTitle></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={salvar}>
        <div><Label htmlFor="recebimento-inscricao">Inscrição</Label><select id="recebimento-inscricao" className="h-10 w-full rounded-md border bg-background px-3" value={inscricaoId} onChange={(e) => setInscricaoId(e.target.value)} required><option value="">Selecione</option>{inscricoes.filter((i) => i.status !== "cancelado").map((i) => <option key={i.id} value={i.id}>{i.nome_completo} · {i.numero_inscricao}</option>)}</select></div>
        {inscricao?.comprovante_url && <Button type="button" variant="outline" onClick={abrirComprovante}>Ver comprovante enviado</Button>}
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="recebimento-valor">Valor recebido (R$)</Label><Input id="recebimento-valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required /></div><div><Label htmlFor="recebimento-data">Data do recebimento</Label><Input id="recebimento-data" type="date" value={data} onChange={(e) => setData(e.target.value)} required /></div></div>
        <div><Label htmlFor="recebimento-tipo">Referente a</Label><select id="recebimento-tipo" className="h-10 w-full rounded-md border bg-background px-3" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="matricula">Matrícula</option><option value="mensalidade">Mensalidade</option><option value="inscricao_evento">Inscrição em evento</option><option value="outro">Outro</option></select></div>
        {tipo === "mensalidade" && <div className="space-y-2"><Label>Meses de referência (opcional até identificação)</Label>{parcelas.map((p, index) => <div key={index} className="flex gap-2"><Input type="month" aria-label={`Mês ${index + 1}`} value={p.competencia} onChange={(e) => setParcelas(parcelas.map((x, n) => n === index ? { ...x, competencia: e.target.value } : x))} /><Input aria-label={`Valor atribuído ${index + 1}`} inputMode="decimal" placeholder="R$" value={p.valor} onChange={(e) => setParcelas(parcelas.map((x, n) => n === index ? { ...x, valor: e.target.value } : x))} /></div>)}<Button type="button" variant="outline" size="sm" disabled={!aluno} onClick={() => setParcelas([...parcelas, { competencia: mes(), valor: "" }])}>Adicionar mês</Button>{!aluno && <p className="text-xs text-muted-foreground">Atribuições ficam disponíveis após a confirmação do aluno.</p>}</div>}
        <p className="text-xs text-muted-foreground">O comprovante ajuda na conferência. O registro nesta tela representa o valor observado pela equipe, sem emissão de cobrança.</p>
        <Button type="submit" disabled={salvando}>{salvando ? "Registrando..." : "Registrar no caixa"}</Button>
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Recebimentos registrados</CardTitle></CardHeader><CardContent className="space-y-3">
      {recebimentos.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há recebimentos.</p>}
      {recebimentos.map((r) => { const i = inscricoes.find((item) => item.id === r.inscricao_id); const a = alunos.find((item) => item.id === r.aluno_id); const meses = atribuicoes.filter((item) => item.recebimento_id === r.id); return <div key={r.id} className="rounded-md border p-3 text-sm"><div className="flex justify-between gap-2"><strong>{i?.nome_completo ?? a?.nome ?? "Histórico agregado"}</strong><span>{formatBRL(Number(r.valor))}</span></div><p>{r.data_recebimento ?? `${r.mes_caixa.slice(0, 7)} · dia desconhecido`} · {r.tipo} · {r.status}</p><p className="text-muted-foreground">{meses.length ? meses.map((item) => <span key={item.id}>{item.competencia.slice(0, 7)}: {formatBRL(Number(item.valor))} <button className="underline" onClick={() => retirar(item.id)}>corrigir</button> · </span>) : "Mês de referência não atribuído"}</p>{r.status === "confirmado" && r.aluno_id && <Button size="sm" variant="outline" className="mt-2 mr-2" onClick={() => atribuir(r.id)}>Atribuir mensalidade</Button>}{r.status === "confirmado" && r.origem === "central" && <Button size="sm" variant="outline" className="mt-2" onClick={() => estornar(r.id)}>Estornar</Button>}</div>; })}
    </CardContent></Card>
  </div>;
};

export default RecebimentosTab;
