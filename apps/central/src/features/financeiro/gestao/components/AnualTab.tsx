import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatBRL } from "@/shared/constants/pricing";
import { UNIDADES_FINANCEIRO } from "@/features/financeiro/model/unidades";
import { useLancamentos, type Lancamento } from "@/features/financeiro/api";
import { round2, sinal } from "@/features/financeiro/model/agregados";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface LinhaGrade {
  label: string;
  valores: number[]; // 12 meses
  total: number;
}

const linhaVazia = (label: string): LinhaGrade => ({ label, valores: Array(12).fill(0), total: 0 });

const fmtCell = (v: number) => (v === 0 ? "—" : formatBRL(v));

/**
 * Grade anual no formato da aba GERAL da planilha: entradas por unidade e
 * por categoria geral, saídas por categoria, e o rodapé encadeado
 * ENTRADA MÊS → SALDO ANTERIOR → TOTAL GERAL → SAÍDA → SALDO.
 */
const AnualTab = () => {
  const { data: lancamentos = [], isLoading } = useLancamentos();

  const anos = useMemo(() => {
    const set = new Set(lancamentos.map((l) => l.competencia.slice(0, 4)));
    set.add(String(new Date().getFullYear()));
    return [...set].sort().reverse();
  }, [lancamentos]);

  const [ano, setAno] = useState(String(new Date().getFullYear()));

  const grade = useMemo(() => {
    const doAno = (l: Lancamento) => l.competencia.slice(0, 4) === ano;
    const mesDe = (l: Lancamento) => Number(l.competencia.slice(5, 7)) - 1;

    const addLinha = (mapa: Map<string, LinhaGrade>, chave: string, label: string, mes: number, valor: number) => {
      const linha = mapa.get(chave) ?? linhaVazia(label);
      linha.valores[mes] += valor;
      linha.total += valor;
      mapa.set(chave, linha);
    };

    // Entradas por unidade (linhas fixas, na ordem das unidades)
    const unidades = new Map<string, LinhaGrade>();
    for (const u of UNIDADES_FINANCEIRO) unidades.set(u.value, linhaVazia(u.label));

    // Entradas gerais (unidade NULL) e saídas, por categoria
    const entradasGerais = new Map<string, LinhaGrade>();
    const saidas = new Map<string, LinhaGrade>();

    const entradaMes = Array(12).fill(0);
    const saidaMes = Array(12).fill(0);

    for (const l of lancamentos) {
      if (!doAno(l)) continue;
      const m = mesDe(l);
      const valor = Number(l.valor);
      const categoria = l.categoria?.nome ?? "Sem categoria";
      if (l.tipo === "entrada") {
        entradaMes[m] += valor;
        if (l.unidade) addLinha(unidades, l.unidade, l.unidade, m, valor);
        else addLinha(entradasGerais, categoria, categoria, m, valor);
      } else {
        saidaMes[m] += valor;
        addLinha(saidas, categoria, categoria, m, valor);
      }
    }

    // Rodapé encadeado: saldo anterior de jan = tudo antes de jan (inclui saldo inicial)
    const antesDoAno = lancamentos.reduce(
      (s, l) => (l.competencia < `${ano}-01-01` ? s + sinal(l) : s),
      0,
    );
    const saldoAnteriorMes: number[] = Array(12).fill(0);
    const totalGeralMes: number[] = Array(12).fill(0);
    const saldoMes: number[] = Array(12).fill(0);
    let acumulado = round2(antesDoAno);
    for (let m = 0; m < 12; m++) {
      saldoAnteriorMes[m] = acumulado;
      totalGeralMes[m] = round2(acumulado + entradaMes[m]);
      saldoMes[m] = round2(totalGeralMes[m] - saidaMes[m]);
      acumulado = saldoMes[m];
    }

    // Resumo do Simpósio (categoria com entrada e saída próprias)
    const simposio = { entrada: 0, saida: 0 };
    for (const l of lancamentos) {
      if (!doAno(l) || l.categoria?.nome !== "Simpósio") continue;
      if (l.tipo === "entrada") simposio.entrada += Number(l.valor);
      else simposio.saida += Number(l.valor);
    }

    return {
      unidades: [...unidades.values()],
      entradasGerais: [...entradasGerais.values()],
      saidas: [...saidas.values()],
      entradaMes,
      saidaMes,
      saldoAnteriorMes,
      totalGeralMes,
      saldoMes,
      simposio,
      temMovimento: entradaMes.some((v) => v !== 0) || saidaMes.some((v) => v !== 0),
    };
  }, [lancamentos, ano]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CelulasNum = ({ valores, classe }: { valores: number[]; classe?: string }) => (
    <>
      {valores.map((v, i) => (
        <td key={i} className={`whitespace-nowrap px-3 py-2 text-right text-xs ${classe ?? ""}`}>
          {fmtCell(v)}
        </td>
      ))}
    </>
  );

  const LinhaDados = ({ linha, classe }: { linha: LinhaGrade; classe?: string }) => (
    <tr className="border-b last:border-0">
      <td className={`sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-2 text-xs font-medium ${classe ?? ""}`}>
        {linha.label}
      </td>
      <CelulasNum valores={linha.valores} classe={classe} />
      <td className={`whitespace-nowrap px-3 py-2 text-right text-xs font-semibold ${classe ?? ""}`}>
        {fmtCell(linha.total)}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Ano</p>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo do Simpósio do ano */}
        <Card>
          <CardContent className="flex items-center gap-6 px-5 py-3 text-sm">
            <span className="font-semibold">Simpósio {ano}</span>
            <span className="text-muted-foreground">
              Entrada: <strong className="text-green-700">{formatBRL(grade.simposio.entrada)}</strong>
            </span>
            <span className="text-muted-foreground">
              Saída: <strong className="text-red-700">{formatBRL(grade.simposio.saida)}</strong>
            </span>
            <span className="text-muted-foreground">
              Saldo: <strong>{formatBRL(grade.simposio.entrada - grade.simposio.saida)}</strong>
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left text-xs font-semibold uppercase">
                    {ano}
                  </th>
                  {MESES.map((m) => (
                    <th key={m} className="px-3 py-2 text-right text-xs font-semibold uppercase">{m}</th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase">Total ano</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-green-50/60">
                  <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold uppercase text-green-800">
                    Entradas por unidade
                  </td>
                </tr>
                {grade.unidades.map((l) => (
                  <LinhaDados key={l.label} linha={l} />
                ))}

                {grade.entradasGerais.length > 0 && (
                  <>
                    <tr className="border-b bg-green-50/60">
                      <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold uppercase text-green-800">
                        Outras entradas (geral)
                      </td>
                    </tr>
                    {grade.entradasGerais.map((l) => (
                      <LinhaDados key={l.label} linha={l} />
                    ))}
                  </>
                )}

                <tr className="border-b bg-red-50/60">
                  <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold uppercase text-red-800">
                    Saídas por categoria
                  </td>
                </tr>
                {grade.saidas.length === 0 ? (
                  <tr className="border-b">
                    <td colSpan={14} className="px-3 py-2 text-center text-xs text-muted-foreground">
                      Nenhuma saída no ano.
                    </td>
                  </tr>
                ) : (
                  grade.saidas.map((l) => <LinhaDados key={l.label} linha={l} />)
                )}

                {/* Rodapé encadeado (linhas 19–23 da aba GERAL) */}
                <LinhaDados
                  linha={{ label: "ENTRADA MÊS", valores: grade.entradaMes, total: grade.entradaMes.reduce((a, b) => a + b, 0) }}
                  classe="bg-muted/40 font-semibold"
                />
                <LinhaDados
                  linha={{ label: "SALDO ANTERIOR", valores: grade.saldoAnteriorMes, total: grade.saldoAnteriorMes[0] }}
                  classe="bg-muted/40"
                />
                <LinhaDados
                  linha={{ label: "TOTAL GERAL", valores: grade.totalGeralMes, total: grade.totalGeralMes[11] }}
                  classe="bg-muted/40 font-semibold"
                />
                <LinhaDados
                  linha={{ label: "SAÍDA", valores: grade.saidaMes, total: grade.saidaMes.reduce((a, b) => a + b, 0) }}
                  classe="bg-muted/40"
                />
                <LinhaDados
                  linha={{ label: "SALDO", valores: grade.saldoMes, total: grade.saldoMes[11] }}
                  classe="bg-primary/10 font-bold"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!grade.temMovimento && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma movimentação registrada em {ano}.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        "—" indica valor zero. SALDO ANTERIOR de janeiro inclui o saldo transportado de anos anteriores;
        TOTAL ANO das linhas de saldo mostra a posição de dezembro.
      </p>
    </div>
  );
};

export default AnualTab;
