import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/services/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ update: supabaseMocks.update })),
    storage: { from: vi.fn() },
  },
}));

import {
  atualizarStatusInscricao,
  type Inscricao,
} from "@/modules/inscricoes/api/commands";

const inscricao: Inscricao = {
  comprovante_url: null,
  consulta_token_hash: null,
  cpf: "12345678900",
  created_at: "2026-10-01T10:00:00.000Z",
  data_nascimento: "1990-01-01",
  email: "aluno@example.com",
  escolaridade: "medio",
  id: "00000000-0000-0000-0000-000000000001",
  modalidade: "presencial",
  nome_completo: "Aluno Teste",
  nucleo: "sede",
  numero_inscricao: "ITS2026-0001",
  status: "comprovante_enviado",
  telefone: "11999999999",
  updated_at: "2026-10-01T10:00:00.000Z",
};

describe("commands de gestão de inscrições", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.update.mockReturnValue({ eq: supabaseMocks.eq });
    supabaseMocks.eq.mockResolvedValue({ error: null });
  });

  it("atualiza o status sem disparar integração de e-mail", async () => {
    await expect(
      atualizarStatusInscricao({ inscricao, status: "confirmada" }),
    ).resolves.toBeUndefined();

    expect(supabaseMocks.update).toHaveBeenCalledWith({ status: "confirmada" });
  });

  it("atualiza qualquer status permitido pela regra do banco", async () => {
    await atualizarStatusInscricao({
      inscricao,
      status: "pagamento_nao_identificado",
    });

    expect(supabaseMocks.update).toHaveBeenCalledWith({ status: "pagamento_nao_identificado" });
  });

  it("interrompe o fluxo quando a alteração de status falha", async () => {
    supabaseMocks.eq.mockResolvedValue({ error: new Error("falha no update") });

    await expect(
      atualizarStatusInscricao({ inscricao, status: "confirmada" }),
    ).rejects.toThrow("falha no update");
  });
});
