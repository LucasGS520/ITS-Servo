import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/services/supabase/client", () => ({ supabase: { rpc } }));

import { excluirLancamento, salvarLancamento } from "@/modules/financeiro/api/commands";

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
});
