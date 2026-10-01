import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, DollarSign, TrendingUp, Clock, XCircle } from "lucide-react";
import { useInscricoes } from "@/features/inscricoes";
import { PRICING } from "@/shared/constants/pricing";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Situacao = "confirmada" | "em_analise" | "pendente" | "nao_identificado";

const situacaoConfig: Record<
  Situacao,
  { label: string; badge: string; icon: React.ElementType }
> = {
  confirmada: { label: "Confirmada", badge: "bg-green-100 text-green-800 border-green-200", icon: TrendingUp },
  em_analise: { label: "Em análise", badge: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  pendente: { label: "Pendente", badge: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  nao_identificado: { label: "Pag. Não Identificado", badge: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const statusToSituacao = (status: string): Situacao | null => {
  if (status === "confirmada") return "confirmada";
  if (status === "comprovante_enviado") return "em_analise";
  if (status === "aguardando_pagamento") return "pendente";
  if (status === "pagamento_nao_identificado") return "nao_identificado";
  return null;
};

const PrevisaoTab = () => {
  const { data: inscricoes = [], isLoading } = useInscricoes();

  const { resumo, linhas } = useMemo(() => {
    const ativas = inscricoes.filter((i) => i.status !== "cancelado");

    const confirmadas = ativas.filter((i) => i.status === "confirmada").length;
    const emAnalise = ativas.filter((i) => i.status === "comprovante_enviado").length;
    const pendentes = ativas.filter((i) => i.status === "aguardando_pagamento").length;
    const naoIdentificado = ativas.filter((i) => i.status === "pagamento_nao_identificado").length;

    const resumo = {
      confirmada: confirmadas * PRICING.TOTAL,
      em_analise: emAnalise * PRICING.TOTAL,
      pendente: pendentes * PRICING.TOTAL,
      nao_identificado: naoIdentificado * PRICING.TOTAL,
      potencial: ativas.length * PRICING.TOTAL,
    };

    const linhas = ativas
      .map((i) => ({
        id: i.id,
        numero: i.numero_inscricao,
        nome: i.nome_completo,
        nucleo: i.modalidade === "correspondencia" ? "Correspondência" : (i.nucleo ?? "Presencial"),
        data: new Date(i.created_at).toLocaleDateString("pt-BR"),
        situacao: statusToSituacao(i.status),
        matricula: PRICING.MATRICULA,
        material: PRICING.MATERIAL,
        total: PRICING.TOTAL,
      }))
      .filter((l) => l.situacao !== null);

    return { resumo, linhas };
  }, [inscricoes]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Previsão das taxas de inscrição — R${PRICING.MATRICULA} matrícula + R${PRICING.MATERIAL} material = R${PRICING.TOTAL}/aluno. Valores potenciais, não lançados no caixa.
      </p>

      {/* ── Resumo financeiro ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-700" />
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Receita confirmada</p>
            </div>
            <p className="text-2xl font-bold text-green-800">{fmt(resumo.confirmada)}</p>
            <p className="mt-1 text-xs text-green-700">Pagamentos verificados</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-700" />
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Em análise</p>
            </div>
            <p className="text-2xl font-bold text-blue-800">{fmt(resumo.em_analise)}</p>
            <p className="mt-1 text-xs text-blue-700">Comprovante enviado, aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-700" />
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pendente</p>
            </div>
            <p className="text-2xl font-bold text-yellow-800">{fmt(resumo.pendente)}</p>
            <p className="mt-1 text-xs text-yellow-700">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Potencial total</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(resumo.potencial)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Se todas as inscrições ativas confirmarem</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabela por aluno ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhamento por aluno</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Núcleo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Matrícula</TableHead>
                  <TableHead className="text-right">Material</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Nenhuma inscrição ativa.
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map((l) => {
                    const cfg = situacaoConfig[l.situacao!];
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{l.numero}</TableCell>
                        <TableCell className="font-medium">{l.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.nucleo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.data}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(l.matricula)}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(l.material)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(l.total)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cfg.badge}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-right text-xs text-muted-foreground">
        Os valores refletem apenas as taxas de inscrição (matrícula + material didático). Inscrições canceladas não aparecem.
      </p>
    </div>
  );
};

export default PrevisaoTab;
