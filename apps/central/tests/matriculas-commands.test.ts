import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/services/supabase/client", () => ({ supabase: { rpc, storage: { from: vi.fn() } } }));

import { atualizarDadosAtendimento, cancelarInscricaoInterna, confirmarInscricaoIts,
  marcarPagamentoNaoIdentificado, resolverCancelamento, salvarIsencaoInscricao } from "@/modules/matriculas/api/commands";

const id = "00000000-0000-0000-0000-000000000001";

describe("comandos da ficha de inscrição", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockImplementation(function (this: { rpc: unknown }) {
      if (this?.rpc !== rpc) throw new Error("RPC perdeu o contexto do cliente");
      return Promise.resolve({ error: null });
    });
  });

  it("confirma independentemente do pagamento, sem criar movimento", async () => {
    await confirmarInscricaoIts(id, null, false, null);
    expect(rpc).toHaveBeenCalledWith("confirmar_inscricao_its", {
      p_inscricao_id: id, p_primeira_competencia: null, p_isento: false, p_motivo: null,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("registra isenção por mensalidade com mês identificado", async () => {
    await salvarIsencaoInscricao(id, "mensalidade", "2026-10", "Decisão da equipe", true);
    expect(rpc).toHaveBeenCalledWith("salvar_isencao_inscricao", expect.objectContaining({
      p_inscricao_id: id, p_finalidade: "mensalidade", p_mes_referencia: "2026-10-01",
    }));
  });

  it("envia decisões justificadas às RPCs administrativas", async () => {
    await marcarPagamentoNaoIdentificado(id, "Não localizado");
    await resolverCancelamento(id, false, "Participação mantida");
    await cancelarInscricaoInterna(id, "Solicitado pela equipe");
    expect(rpc).toHaveBeenCalledWith("marcar_pagamento_nao_identificado_its", { p_inscricao_id: id, p_motivo: "Não localizado" });
    expect(rpc).toHaveBeenCalledWith("resolver_cancelamento_inscricao", { p_solicitacao_id: id, p_aprovar: false, p_motivo: "Participação mantida" });
    expect(rpc).toHaveBeenCalledWith("cancelar_inscricao_interna", { p_inscricao_id: id, p_motivo: "Solicitado pela equipe" });
  });

  it("propaga falhas do banco na correção de dados", async () => {
    rpc.mockResolvedValue({ error: new Error("falha na atualização") });
    await expect(atualizarDadosAtendimento({ inscricaoId: id, nomeCompleto: "Maria da Silva", telefone: "11999999999",
      email: "maria@example.com", dataNascimento: "1990-01-01", escolaridade: "medio" })).rejects.toThrow("falha na atualização");
  });
});
