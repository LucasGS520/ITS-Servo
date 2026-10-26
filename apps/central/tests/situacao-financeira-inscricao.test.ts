import { describe, expect, it } from "vitest";
import type { Inscricao } from "@/modules/matriculas/api";
import type { Lancamento } from "@/modules/financeiro/api";
import { recebidoLiquido, situacaoFinanceira } from "@/modules/matriculas/model/financeiro";

const inscricao = { id: "i", destino: "curso", isento: false, comprovante_url: null } as Inscricao;
const entrada = { id: "e", inscricao_id: "i", tipo: "entrada", finalidade: "matricula", valor: 40, estorno_de_id: null } as Lancamento;

describe("situação financeira da inscrição", () => {
  it("distingue gratuidade de preço desconhecido", () => {
    expect(situacaoFinanceira(inscricao, [], 0)).toBe("Gratuita");
    expect(situacaoFinanceira(inscricao, [], null)).toBe("Valor não configurado");
  });
  it("não confunde comprovante com recebimento", () => {
    expect(situacaoFinanceira({ ...inscricao, comprovante_url: "privado.pdf" }, [], 40)).toContain("sem recebimento");
  });
  it("desconta devolução e não mistura mensalidade com matrícula", () => {
    const devolucao = { id: "d", tipo: "saida", estorno_de_id: "e", valor: 15 } as Lancamento;
    const mensalidade = { id: "m", tipo: "entrada", finalidade: "mensalidade", valor: 150, estorno_de_id: null } as Lancamento;
    expect(recebidoLiquido([entrada, devolucao, mensalidade], "matricula")).toBe(25);
    expect(situacaoFinanceira(inscricao, [entrada, devolucao, mensalidade], 40)).toBe("Recebido parcialmente");
  });
  it("trata isenção de item separadamente do caixa", () => {
    expect(situacaoFinanceira(inscricao, [], 40, [{ id: "x", inscricao_id: "i", finalidade: "matricula", mes_referencia: null, motivo: "Decisão", ativo: true, created_at: "" }])).toBe("Isenta");
    expect(recebidoLiquido([])).toBe(0);
  });
});
