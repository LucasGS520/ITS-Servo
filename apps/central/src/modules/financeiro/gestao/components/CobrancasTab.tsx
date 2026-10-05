import { useMemo } from "react";
import { ExternalLink, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/common/ui/badge";
import { Button } from "@/common/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { formatBRL } from "@/common/constants/pricing";
import { getErrorMessage } from "@/common/lib/errors";
import { useToast } from "@/common/hooks/use-toast";
import { obterUrlComprovante, useMatriculas } from "@/modules/matriculas";
import { useCobrancas, useConciliarPagamento, useEstornarPagamento, usePagamentos, useRecusarPagamento } from "@/modules/financeiro";

const CobrancasTab = () => {
  const { toast } = useToast();
  const { data: cobrancas = [] } = useCobrancas();
  const { data: pagamentos = [] } = usePagamentos();
  const { data: inscricoes = [] } = useMatriculas();
  const conciliar = useConciliarPagamento(); const recusar = useRecusarPagamento(); const estornar = useEstornarPagamento();
  const saldos = useMemo(() => new Map(cobrancas.map((c) => [c.id, Number(c.valor_devido) - pagamentos.filter((p) => p.cobranca_id === c.id && p.status === "conciliado").reduce((s, p) => s + Number(p.valor ?? 0), 0)])), [cobrancas, pagamentos]);
  const pendentes = pagamentos.filter((p) => p.status === "pendente");
  const abrirComprovante = async (path: string | null) => { if (!path) return; try { window.open(await obterUrlComprovante(path), "_blank", "noopener,noreferrer"); } catch (error) { toast({ title: "Não foi possível abrir o comprovante", description: getErrorMessage(error), variant: "destructive" }); } };
  const confirmar = async (pagamentoId: string, cobrancaId: string | null) => {
    const saldo = cobrancaId ? saldos.get(cobrancaId) ?? 0 : 0;
    if (saldo <= 0) { toast({ title: "Saldo inválido para confirmação", variant: "destructive" }); return; }
    try { await conciliar.mutateAsync({ id: pagamentoId, valor: saldo }); toast({ title: "Recebimento confirmado", description: "Financeiro e inscrição foram atualizados automaticamente." }); } catch (error) { toast({ title: "Não foi possível confirmar", description: getErrorMessage(error), variant: "destructive" }); }
  };
  const parcial = async (pagamentoId: string, cobrancaId: string | null) => {
    const saldo = cobrancaId ? saldos.get(cobrancaId) ?? 0 : 0;
    const texto = window.prompt("Valor efetivamente recebido (R$):", String(saldo).replace(".", ","));
    if (!texto) return;
    const valor = Number(texto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) { toast({ title: "Informe um valor válido", variant: "destructive" }); return; }
    try { await conciliar.mutateAsync({ id: pagamentoId, valor }); toast({ title: "Valor diferente registrado", description: "A cobrança foi recalculada." }); } catch (error) { toast({ title: "Não foi possível registrar", description: getErrorMessage(error), variant: "destructive" }); }
  };
  const rejeitar = async (pagamentoId: string) => { const motivo = window.prompt("Motivo da recusa do comprovante:"); if (!motivo?.trim()) return; try { await recusar.mutateAsync({ id: pagamentoId, motivo }); toast({ title: "Comprovante recusado" }); } catch (error) { toast({ title: "Não foi possível recusar", description: getErrorMessage(error), variant: "destructive" }); } };
  const estornarRecebimento = async (pagamentoId: string) => { const motivo = window.prompt("Motivo do estorno:"); if (!motivo?.trim()) return; try { await estornar.mutateAsync({ id: pagamentoId, motivo }); toast({ title: "Recebimento estornado", description: "O caixa e a inscrição foram recalculados." }); } catch (error) { toast({ title: "Não foi possível estornar", description: getErrorMessage(error), variant: "destructive" }); } };
  return <div className="space-y-6"><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Cobranças</CardTitle></CardHeader><CardContent className="space-y-3">{cobrancas.length ? cobrancas.map((c) => <div className="rounded-lg border p-3" key={c.id}><div className="flex justify-between gap-3"><div><p className="font-medium">{c.referente}</p><p className="text-sm text-muted-foreground">Vencimento: {c.vencimento ?? "não definido"}</p></div><Badge variant={c.status === "quitada" ? "default" : "outline"}>{c.status}</Badge></div><p className="mt-2 text-sm">Saldo: <strong>{formatBRL(saldos.get(c.id) ?? Number(c.valor_devido))}</strong></p></div>) : <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Comprovantes para conferência</CardTitle></CardHeader><CardContent className="space-y-3">{pendentes.length ? pendentes.map((p) => { const inscricao = inscricoes.find((i) => i.id === p.inscricao_id); const saldo = p.cobranca_id ? saldos.get(p.cobranca_id) ?? 0 : 0; return <div className="space-y-3 rounded-lg border p-3" key={p.id}><div><p className="font-medium">{inscricao?.nome_completo ?? "Pagamento recebido"}</p><p className="text-sm text-muted-foreground">{inscricao?.numero_inscricao ?? "Cobrança avulsa"} · Saldo: {formatBRL(saldo)}</p></div><div className="flex flex-wrap gap-2">{p.comprovante_url && <Button size="sm" variant="outline" onClick={() => abrirComprovante(p.comprovante_url)}><ExternalLink className="mr-2 h-4 w-4" />Comprovante</Button>}<Button size="sm" onClick={() => confirmar(p.id, p.cobranca_id)} disabled={conciliar.isPending}>Confirmar recebimento · {formatBRL(saldo)}</Button><Button size="sm" variant="outline" onClick={() => parcial(p.id, p.cobranca_id)} disabled={conciliar.isPending}>Valor diferente</Button><Button size="sm" variant="destructive" onClick={() => rejeitar(p.id)} disabled={recusar.isPending}><XCircle className="mr-2 h-4 w-4" />Recusar</Button></div></div>; }) : <p className="text-sm text-muted-foreground">Nenhum comprovante aguardando conferência.</p>}</CardContent></Card></div><Card><CardHeader><CardTitle className="text-base">Pagamentos conciliados</CardTitle></CardHeader><CardContent className="space-y-3">{pagamentos.filter((p) => p.status === "conciliado").map((p) => <div className="flex items-center justify-between rounded-lg border p-3" key={p.id}><span className="font-medium">{formatBRL(Number(p.valor ?? 0))}</span><Button size="sm" variant="outline" onClick={() => estornarRecebimento(p.id)} disabled={estornar.isPending}><RotateCcw className="mr-2 h-4 w-4" />Estornar</Button></div>)}</CardContent></Card></div>;
};
export default CobrancasTab;
