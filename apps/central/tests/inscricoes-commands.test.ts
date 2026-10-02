import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  update: vi.fn(),
  eq: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/services/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ update: supabaseMocks.update })),
    functions: { invoke: supabaseMocks.invoke },
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
    supabaseMocks.invoke.mockResolvedValue({ error: null });
  });

  it("confirma a inscrição e solicita o e-mail", async () => {
    await expect(
      atualizarStatusInscricao({ inscricao, status: "confirmada" }),
    ).resolves.toEqual({ emailConfirmacaoFalhou: false });

    expect(supabaseMocks.update).toHaveBeenCalledWith({ status: "confirmada" });
    expect(supabaseMocks.invoke).toHaveBeenCalledWith(
      "enviar-email-confirmacao",
      expect.objectContaining({
        body: expect.objectContaining({ numero_inscricao: "ITS2026-0001" }),
      }),
    );
  });

  it("mantém a alteração bem-sucedida visível quando o e-mail falha", async () => {
    supabaseMocks.invoke.mockRejectedValue(new Error("indisponível"));

    await expect(
      atualizarStatusInscricao({ inscricao, status: "confirmada" }),
    ).resolves.toEqual({ emailConfirmacaoFalhou: true });
  });

  it("não dispara e-mail para outros status", async () => {
    await atualizarStatusInscricao({
      inscricao,
      status: "pagamento_nao_identificado",
    });

    expect(supabaseMocks.invoke).not.toHaveBeenCalled();
  });

  it("interrompe o fluxo quando a alteração de status falha", async () => {
    supabaseMocks.eq.mockResolvedValue({ error: new Error("falha no update") });

    await expect(
      atualizarStatusInscricao({ inscricao, status: "confirmada" }),
    ).rejects.toThrow("falha no update");
    expect(supabaseMocks.invoke).not.toHaveBeenCalled();
  });
});
