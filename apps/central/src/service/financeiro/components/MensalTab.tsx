import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer } from "lucide-react";
import { formatBRL } from "@/shared/constants/pricing";
import { UNIDADE_LABELS, UNIDADES_FINANCEIRO } from "@/shared/constants/unidades";
import { useLancamentos } from "@/service/financeiro/hooks/useFinanceiro";
import { formatCompetencia, formatData, mesParaCompetencia, round2, saldoAnterior } from "./agregados";
import { printRelatorioMensal, type LinhaRelatorio, type ResumoItem } from "./printRelatorio";

/**
 * Espelho do relatório mensal impresso e assinado:
 * - Por unidade: movimentos do mês, saldo corrente partindo de zero (como as
 *   abas por núcleo da planilha).
 * - Geral (consolidado): tudo do mês, partindo do SALDO ANTERIOR acumulado
 *   (como a aba GERAL da planilha).
 */
const MensalTab = () => {
  const { data: lancamentos = [], isLoading } = useLancamentos();
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [unidade, setUnidade] = useState("geral");

  const competencia = mesParaCompetencia(mes);
  const geral = unidade === "geral";

  const { linhas, resumo, totalGeral, saldoInicio, unidadeLabel, titulo } = useMemo(() => {
    const doMes = lancamentos
      .filter((l) => l.competencia === competencia && (geral || l.unidade === unidade))
      .sort((a, b) => a.data.localeCompare(b.data) || a.created_at.localeCompare(b.created_at));

    const inicio = geral ? saldoAnterior(lancamentos, competencia) : 0;

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
        data: formatData(l.data),
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
  }, [lancamentos, competencia, unidade, geral]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    </div>
  );
};

export default MensalTab;
