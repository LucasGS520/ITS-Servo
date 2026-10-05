import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/services/supabase/client", () => ({ supabase: { rpc, storage: { from: vi.fn() } } }));

import { atualizarDadosAtendimento, atualizarStatusInscricao, type Inscricao } from "@/modules/matriculas/api/commands";

const inscricao = { id: "00000000-0000-0000-0000-000000000001", status: "comprovante_enviado" } as Inscricao;

describe("comandos de gestão de matrículas", () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ error: null }); });

  it("altera uma exceção operacional pela RPC auditável", async () => {
    await atualizarStatusInscricao({ inscricao, status: "pagamento_nao_identificado", motivo: "Valor não localizado" });
    expect(rpc).toHaveBeenCalledWith("alterar_status_matricula", {
      p_inscricao_id: inscricao.id,
      p_status: "pagamento_nao_identificado",
      p_motivo: "Valor não localizado",
    });
  });

  it("normaliza motivo vazio para nulo", async () => {
    await atualizarStatusInscricao({ inscricao, status: "cancelado", motivo: "  " });
    expect(rpc).toHaveBeenCalledWith("alterar_status_matricula", expect.objectContaining({ p_motivo: null }));
  });

  it("propaga a falha devolvida pelo banco", async () => {
    rpc.mockResolvedValue({ error: new Error("transição recusada") });
    await expect(atualizarStatusInscricao({ inscricao, status: "cancelado", motivo: "Solicitado" })).rejects.toThrow("transição recusada");
  });

  it("corrige dados pelo comando de Atendimento, sem alterar o status", async () => {
    await atualizarDadosAtendimento({
      inscricaoId: inscricao.id,
      nomeCompleto: "Maria da Silva",
      telefone: "11999999999",
      email: "maria@example.com",
      dataNascimento: "1990-01-01",
      escolaridade: "Ensino médio",
    });

    expect(rpc).toHaveBeenCalledWith("atualizar_atendimento", expect.objectContaining({
      p_inscricao_id: inscricao.id,
      p_nome_completo: "Maria da Silva",
      p_email: "maria@example.com",
    }));
  });
});
