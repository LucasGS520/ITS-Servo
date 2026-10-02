import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Button } from "@/common/ui/button";
import { Badge } from "@/common/ui/badge";
import { useToast } from "@/common/hooks/use-toast";
import { formatBRL } from "@/common/constants/pricing";
import { getErrorMessage } from "@/common/lib/errors";
import { useCobrancas, useConciliarPagamento, usePagamentos } from "@/modules/financeiro/api";

const CobrancasTab = () => {
  const { toast } = useToast();
  const { data: cobrancas = [] } = useCobrancas();
  const { data: pagamentos = [] } = usePagamentos();
  const conciliar = useConciliarPagamento();
  const saldos = useMemo(() => new Map(cobrancas.map((cobranca) => [
    cobranca.id,
    Number(cobranca.valor_devido) - pagamentos.filter((pagamento) => pagamento.cobranca_id === cobranca.id && pagamento.status === "conciliado").reduce((total, pagamento) => total + Number(pagamento.valor ?? 0), 0),
  ])), [cobrancas, pagamentos]);

  const confirmar = async (pagamentoId: string, cobrancaId: string | null) => {
    const saldo = cobrancaId ? saldos.get(cobrancaId) ?? 0 : 0;
    const texto = window.prompt("Valor recebido (R$):", saldo ? String(saldo).replace(".", ",") : "");
    if (!texto) return;
    const valor = Number(texto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) { toast({ title: "Informe um valor válido.", variant: "destructive" }); return; }
    try {
      await conciliar.mutateAsync({ id: pagamentoId, valor });
      toast({ title: "Pagamento conciliado", description: "A entrada foi registrada no Registro Financeiro." });
    } catch (error) {
      toast({ title: "Não foi possível conciliar", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const pendentes = pagamentos.filter((pagamento) => pagamento.status === "pendente");
  return <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Cobranças</CardTitle></CardHeader><CardContent className="space-y-3">{cobrancas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p> : cobrancas.map((cobranca) => <div key={cobranca.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{cobranca.referente}</p><p className="text-sm text-muted-foreground">Vencimento: {cobranca.vencimento ?? "não definido"}</p></div><Badge variant={cobranca.status === "quitada" ? "default" : "outline"}>{cobranca.status === "quitada" ? "Quitada" : "Em aberto"}</Badge></div><p className="mt-2 text-sm">Saldo: <strong>{formatBRL(saldos.get(cobranca.id) ?? Number(cobranca.valor_devido))}</strong></p></div>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Pagamentos pendentes de conciliação</CardTitle></CardHeader><CardContent className="space-y-3">{pendentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento aguardando conferência.</p> : pendentes.map((pagamento) => <div key={pagamento.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Comprovante recebido</p><p className="text-sm text-muted-foreground">{pagamento.created_at.slice(0, 10)}</p></div><Button size="sm" onClick={() => confirmar(pagamento.id, pagamento.cobranca_id)} disabled={conciliar.isPending}>Conciliar</Button></div>)}</CardContent></Card></div>;
};

export default CobrancasTab;
