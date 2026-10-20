import { useMemo, useState } from "react";
import { Card, CardContent } from "@/common/ui/card";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/ui/table";
import { FileCheck2, Loader2, Printer } from "lucide-react";
import { formatBRL } from "@/common/constants/pricing";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/modules/financeiro/model/unidades";
import { useEmitirRelatorioMensal, useLancamentos, useRelatoriosMensais, useSaldosIniciais } from "@/modules/financeiro/api";
import { useToast } from "@/common/hooks/use-toast";
import { getErrorMessage } from "@/common/lib/errors";
import type { Json } from "@its-servo/supabase/types";
import { formatCompetencia, formatData, mesParaCompetencia, round2, saldoAnterior } from "@/modules/financeiro/model/agregados";
import { printRelatorioMensal, type LinhaRelatorio, type ResumoItem } from "@/modules/financeiro/gestao/lib/printRelatorio";

/**
 * Espelho do relatório mensal impresso e assinado:
 * - Por unidade: movimentos do mês, saldo corrente partindo de zero (como as
 *   abas por núcleo da planilha).
 * - Geral (consolidado): tudo do mês, partindo do SALDO ANTERIOR acumulado
 *   (como a aba GERAL da planilha).
 */
const MensalTab = () => {
  const { toast } = useToast();
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const { data: saldos = [] } = useSaldosIniciais();
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [unidade, setUnidade] = useState("geral");

  const competencia = mesParaCompetencia(mes);
  const { data: versoes = [] } = useRelatoriosMensais(competencia);
  const emitir = useEmitirRelatorioMensal();
  const geral = unidade === "geral";

  const { linhas, resumo, totalGeral, saldoInicio, unidadeLabel, titulo } = useMemo(() => {
    const doMes = lancamentos
      .filter((l) => l.mes_caixa === competencia && (geral || l.unidade === unidade))
      .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? "") || a.created_at.localeCompare(b.created_at));

    const inicio = geral ? saldoAnterior(lancamentos, competencia, saldos) : 0;

    let saldo = inicio;
    let entrada = 0;
    let saida = 0;
    const linhas: LinhaRelatorio[] = doMes.map((l) => {
      const valor = Number(l.valor);
      const isEntrada = l.tipo === "entrada";
      if (isEntrada) entrada += valor;
      else saida += valor;
      saldo = round2(saldo + (isEntrada ? valor : -valor));
      const base = l.aluno?.nome ?? l.descricao ?? l.categoria?.nome ?? "—";
      const nome = geral && l.unidade ? `${base} — ${UNIDADE_LABELS[l.unidade] ?? l.unidade}` : base;
      return {
        data: formatData(l.data, l.mes_caixa),
        nome,
        entrada: isEntrada ? valor : null,
        saida: isEntrada ? null : valor,
        saldo,
      };
    });

    const resumo: ResumoItem[] = geral
      ? [
          { label: "Entrada do mês", valor: entrada },
          { label: "Saída", valor: saida },
          { label: "Saldo anterior", valor: inicio },
          { label: "Total geral", valor: inicio + entrada - saida },
        ]
      : [
          { label: "Entrada do mês", valor: entrada },
          { label: "Saída", valor: saida },
          { label: "Total geral", valor: entrada - saida },
        ];

    return {
      linhas,
      resumo,
      saldoInicio: inicio,
      totalGeral: round2(inicio + entrada - saida),
      unidadeLabel: geral ? "Geral (consolidado)" : UNIDADE_LABELS[unidade] ?? unidade,
      titulo: geral ? "RELATÓRIO FINANCEIRO GERAL" : "RELATÓRIO FINANCEIRO POR NÚCLEO",
    };
  }, [lancamentos, competencia, unidade, geral, saldos]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const emitirVersao = async () => {
    try {
      await emitir.mutateAsync({
        periodo: competencia,
        dados: { unidade, unidadeLabel, titulo, saldoInicio, totalGeral, resumo, linhas } as unknown as Json,
      });
      toast({ title: "Versão mensal emitida", description: "O retrato do relatório foi preservado no histórico." });
    } catch (erro) {
      toast({ title: "Não foi possível emitir", description: getErrorMessage(erro), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Mês</p>
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Unidade</p>
          <Select value={unidade} onValueChange={setUnidade}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral (consolidado)</SelectItem>
              {UNIDADES_FINANCEIRO.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Button
          onClick={() =>
            printRelatorioMensal({
              titulo,
              unidadeLabel,
              mesLabel: formatCompetencia(competencia),
              linhas,
              resumo,
              totalGeral,
            })
          }
        >
          <Printer className="mr-2 h-4 w-4" /> Imprimir relatório
        </Button>
        <Button variant="outline" onClick={emitirVersao} disabled={emitir.isPending}>
          <FileCheck2 className="mr-2 h-4 w-4" /> Emitir versão
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Data</TableHead>
                  <TableHead>Nome do aluno / Descrição</TableHead>
                  <TableHead className="w-32 text-right">Entrada</TableHead>
                  <TableHead className="w-32 text-right">Saída</TableHead>
                  <TableHead className="w-36 text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geral && (
                  <TableRow className="bg-muted/40">
                    <TableCell className="text-sm text-muted-foreground" />
                    <TableCell className="text-sm font-medium text-muted-foreground">Saldo anterior</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right text-sm font-semibold">
                      {formatBRL(saldoInicio)}
                    </TableCell>
                  </TableRow>
                )}
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Sem movimentações no mês selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-muted-foreground">{l.data}</TableCell>
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-700">
                        {l.entrada != null ? formatBRL(l.entrada) : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-red-700">
                        {l.saida != null ? formatBRL(l.saida) : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatBRL(l.saldo)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted/60 font-semibold">
                  <TableCell colSpan={4} className="uppercase">Total geral</TableCell>
                  <TableCell className="text-right">{formatBRL(totalGeral)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-sm space-y-1 text-sm">
        {resumo.map((r) => (
          <div key={r.label} className="flex justify-between border-b py-1">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-semibold">{formatBRL(r.valor)}</span>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="font-medium">Histórico de versões — {formatCompetencia(competencia)}</p>
          {versoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma versão emitida.</p> : versoes.map((versao) => (
            <div key={versao.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Versão {versao.versao} · {new Date(versao.created_at).toLocaleString("pt-BR")}</span>
              <span className={versao.status === "emitida" ? "text-foreground" : "text-destructive"}>{versao.status === "emitida" ? "Emitida" : "Revisão pendente"}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MensalTab;
