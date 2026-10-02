import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/ui/card";
import { Loader2, Users, DollarSign, Clock, AlertTriangle, TrendingUp, MapPin, BookOpen } from "lucide-react";
import {
  STATUS_INSCRICAO,
  STATUS_INSCRICAO_INFO,
  useInscricoes,
  type StatusInscricao,
} from "@/modules/inscricoes";
import { useLancamentos } from "@/modules/financeiro/api";

const statusColors: Record<StatusInscricao, string> = {
  aguardando_pagamento: "bg-yellow-50 border-yellow-200 text-yellow-800",
  comprovante_enviado: "bg-blue-50 border-blue-200 text-blue-800",
  confirmada: "bg-green-50 border-green-200 text-green-800",
  pagamento_nao_identificado: "bg-red-50 border-red-200 text-red-800",
  cancelado: "bg-gray-50 border-gray-200 text-gray-500",
};

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardPage = () => {
  const { data: inscricoes = [], isLoading } = useInscricoes();
  const { data: registros = [] } = useLancamentos();

  const stats = useMemo(() => {
    const agora = new Date();
    const inicioDeMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const ativas = inscricoes.filter((i) => i.status === "confirmada");
    const novasMes = inscricoes.filter(
      (i) => new Date(i.created_at) >= inicioDeMes && i.status !== "cancelado"
    );
    const pendentesAnalise = inscricoes.filter((i) => i.status === "comprovante_enviado");
    const receitaRealizada = registros.reduce(
      (total, registro) => total + (registro.tipo === "entrada" ? Number(registro.valor) : -Number(registro.valor)),
      0,
    );

    const porStatus = STATUS_INSCRICAO.reduce<Record<string, number>>((acc, key) => {
      acc[key] = inscricoes.filter((i) => i.status === key).length;
      return acc;
    }, {});

    const porModalidade = {
      presencial: inscricoes.filter((i) => i.modalidade === "presencial" && i.status !== "cancelado").length,
      correspondencia: inscricoes.filter((i) => i.modalidade === "correspondencia" && i.status !== "cancelado").length,
    };

    const porNucleo: Record<string, number> = {};
    inscricoes.forEach((i) => {
      if (i.nucleo && i.status !== "cancelado") {
        porNucleo[i.nucleo] = (porNucleo[i.nucleo] || 0) + 1;
      }
    });

    const nucleosOrdenados = Object.entries(porNucleo).sort((a, b) => b[1] - a[1]);

    return {
      ativas: ativas.length,
      novasMes: novasMes.length,
      pendentesAnalise: pendentesAnalise.length,
      receitaRealizada,
      porStatus,
      porModalidade,
      nucleosOrdenados,
    };
  }, [inscricoes, registros]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do instituto</p>
      </div>

      {/* ── Métricas principais ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Users className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alunos ativos</p>
              <p className="text-3xl font-bold text-foreground">{stats.ativas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Novas inscrições (mês)</p>
              <p className="text-3xl font-bold text-foreground">{stats.novasMes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pendentesAnalise > 0 ? "border-blue-200 bg-blue-50/50" : ""}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <Clock className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
              <p className="text-3xl font-bold text-foreground">{stats.pendentesAnalise}</p>
              {stats.pendentesAnalise > 0 && (
                <p className="text-xs text-blue-600 font-medium">Requerem ação</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <DollarSign className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita realizada</p>
              <p className="text-2xl font-bold text-foreground">{fmt(stats.receitaRealizada)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Status das inscrições ── */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Inscrições por status
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_INSCRICAO.map((key) => (
            <Card key={key} className={`border ${statusColors[key]}`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium">
                  {STATUS_INSCRICAO_INFO[key].labelGestao}
                </p>
                <p className="mt-1 text-3xl font-bold">{stats.porStatus[key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Detalhamento ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Por modalidade */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Por modalidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Presencial", count: stats.porModalidade.presencial, color: "bg-primary" },
              { label: "Correspondência", count: stats.porModalidade.correspondencia, color: "bg-secondary" },
            ].map(({ label, count, color }) => {
              const total = stats.porModalidade.presencial + stats.porModalidade.correspondencia;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Por núcleo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Por núcleo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nucleosOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
            ) : (
              <div className="space-y-2">
                {stats.nucleosOrdenados.map(([nucleo, count]) => (
                  <div key={nucleo} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{nucleo}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {count}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Correspondência</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    {stats.porModalidade.correspondencia}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso de atenção se houver pagamentos não identificados */}
      {(stats.porStatus.pagamento_nao_identificado ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-700">
              <strong>{stats.porStatus.pagamento_nao_identificado}</strong>{" "}
              {stats.porStatus.pagamento_nao_identificado === 1
                ? "inscrição com pagamento não identificado."
                : "inscrições com pagamento não identificado."}{" "}
              Verifique na aba <strong>Inscrições</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
