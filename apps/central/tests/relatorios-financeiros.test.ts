import { describe, expect, it } from "vitest";
import type { Lancamento } from "@/modules/financeiro/api";
import { relatorioGeralMensal, relatorioNucleoMensal } from "@/modules/relatorios/model/financeiro";

const movimento = (id: string, valor: number, tipo: "entrada" | "saida", unidade: string | null, descricao: string): Lancamento => ({
  id, valor, tipo, unidade, descricao, mes_caixa: "2026-09-01", data: "2026-09-04", created_at: "2026-09-04T12:00:00Z",
  categoria_id: id, categoria: { nome: descricao, tipo }, aluno: null, inscricao: null,
  curso_id: null, edicao_simposio_id: null, conciliacao_status: "conciliado", precisao_data: "dia",
} as unknown as Lancamento);

describe("relatórios financeiros dos modelos do ITS", () => {
  it("transporta o saldo no geral e não o mistura com o resultado das linhas", () => {
    const movimentos = [
      movimento("engenho", 100, "entrada", "engenho_novo", "Engenho Novo"),
      movimento("osasco", 300, "entrada", "osasco", "Osasco"),
      movimento("correspondencia", 300, "entrada", "correspondencia", "Correspondência"),
      movimento("simposio", 5895, "entrada", null, "Simpósio"),
      movimento("capacitacao", 2010, "entrada", null, "Capacitação"),
      movimento("doacao", 200, "entrada", "engenho_novo", "Doação"),
      movimento("saida-simposio", 8015.43, "saida", null, "Saída Simpósio"),
      movimento("contabilidade", 500, "saida", null, "Contabilidade"),
    ];
    const geral = relatorioGeralMensal(movimentos, "2026-09", [{ ano: 2026, valor: 24339.73 }], [], []);
    expect(geral.entradas).toBe(8805);
    expect(geral.saidas).toBe(8515.43);
    expect(geral.resultado).toBe(289.57);
    expect(geral.saldoFinal).toBe(24629.3);
    expect(geral.grupos.reduce((s, g) => s + g.resultado, 0)).toBeCloseTo(289.57);
  });

  it("mostra o núcleo sem transportar o saldo geral e mantém dia desconhecido", () => {
    const entrada = movimento("a", 100, "entrada", "engenho_novo", "Davi Roseno");
    entrada.data = null;
    entrada.precisao_data = "mes";
    entrada.aluno = { nome: "Davi Roseno" };
    const nucleo = relatorioNucleoMensal([entrada], "2026-09", "engenho_novo");
    expect(nucleo.saldoFinal).toBe(100);
    expect(nucleo.linhas[0].nome).toBe("Davi Roseno");
    expect(nucleo.linhas[0].data).toContain("dia desconhecido");
  });
});
