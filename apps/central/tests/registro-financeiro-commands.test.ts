import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/services/supabase/client", () => ({ supabase: { rpc } }));

import { conciliarPagamento, emitirRelatorioMensal, estornarPagamento, excluirLancamento, recusarPagamento, salvarCobranca, salvarLancamento } from "@/modules/financeiro/api/commands";

const values = {
  tipo: "saida" as const,
  valor: 40,
  data: "2026-10-02",
  competencia: "2026-10-01",
  unidade: null,
  categoria_id: "00000000-0000-0000-0000-000000000001",
  aluno_id: null,
  descricao: "Material didático",
};

describe("comandos do Registro Financeiro", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("cria movimentação pelo comando protegido do backend", async () => {
    await salvarLancamento({ values });

    expect(rpc).toHaveBeenCalledWith(
      "criar_registro_financeiro",
      expect.objectContaining({ p_tipo: "saida", p_valor: 40, p_data: "2026-10-02" }),
    );
  });

  it("não permite editar uma movimentação existente", async () => {
    await expect(salvarLancamento({ id: "registro-1", values })).rejects.toThrow("não são editados");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("corrige por estorno auditável, nunca por exclusão", async () => {
    await excluirLancamento({ id: "registro-1", motivo: "Valor digitado incorretamente" });

    expect(rpc).toHaveBeenCalledWith("corrigir_registro_financeiro", {
      p_registro_id: "registro-1",
      p_motivo: "Valor digitado incorretamente",
    });
  });

  it("concilia pagamento pela operação que também confirma a matrícula quitada", async () => {
    await conciliarPagamento({ id: "pagamento-1", valor: 190 });
    expect(rpc).toHaveBeenCalledWith("conciliar_pagamento", expect.objectContaining({ p_pagamento_id: "pagamento-1", p_valor: 190 }));
  });

  it("recusa comprovante com motivo auditável", async () => {
    await recusarPagamento({ id: "pagamento-1", motivo: "Documento ilegível" });
    expect(rpc).toHaveBeenCalledWith("recusar_pagamento", { p_pagamento_id: "pagamento-1", p_motivo: "Documento ilegível" });
  });

  it("estorna pagamento pela operação que reabre cobrança e matrícula", async () => {
    await estornarPagamento({ id: "pagamento-1", motivo: "Crédito devolvido" });
    expect(rpc).toHaveBeenCalledWith("estornar_pagamento", { p_pagamento_id: "pagamento-1", p_motivo: "Crédito devolvido" });
  });

  it("salva cobrança somente pela RPC protegida", async () => {
    await salvarCobranca({ values: { pessoa_id: "pessoa-1", categoria_id: "categoria-1", referente: "Curso", valor_devido: 250 } });
    expect(rpc).toHaveBeenCalledWith("salvar_cobranca", expect.objectContaining({ p_pessoa_id: "pessoa-1", p_valor_devido: 250 }));
  });

  it("emite uma versão imutável do relatório mensal", async () => {
    await emitirRelatorioMensal({ periodo: "2026-10-01", dados: { total: 120 } });
    expect(rpc).toHaveBeenCalledWith("emitir_relatorio_mensal", { p_periodo: "2026-10-01", p_dados: { total: 120 } });
  });
});
