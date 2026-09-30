import { describe, expect, it, vi } from "vitest";
import {
  criarInscricao,
  solicitarInscricao,
  type InscricaoDTO,
} from "@its-servo/supabase";

const dto: InscricaoDTO = {
  nome_completo: "Maria da Silva",
  cpf: "12345678909",
  telefone: "11999999999",
  email: "maria@example.com",
  data_nascimento: "1990-01-01",
  escolaridade: "medio",
  modalidade: "correspondencia",
  nucleo: null,
};

const makeClient = (invoke = vi.fn()) => ({
  functions: { invoke },
}) as never;

describe("contrato público Site → Central", () => {
  it("registra a solicitação pela edge function e devolve credenciais para o autosserviço", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        numero_inscricao: "ITS2026-0001",
        token: "token-de-posse",
        email_enviado: true,
      },
      error: null,
    });

    await expect(solicitarInscricao(makeClient(invoke), dto)).resolves.toEqual({
      numero_inscricao: "ITS2026-0001",
      token: "token-de-posse",
      email_enviado: true,
    });
    expect(invoke).toHaveBeenCalledWith("criar-inscricao", { body: dto });
  });

  it("preserva o alias técnico para consumidores ainda não migrados", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { numero_inscricao: "ITS2026-0002", token: "outro-token", email_enviado: false },
      error: null,
    });

    await expect(criarInscricao(makeClient(invoke), dto)).resolves.toMatchObject({
      numero_inscricao: "ITS2026-0002",
      token: "outro-token",
    });
  });

  it("expõe a mensagem validada pelo backend quando a solicitação é recusada", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { context: new Response(JSON.stringify({ error: "CPF inválido." })) },
    });

    await expect(solicitarInscricao(makeClient(invoke), dto)).rejects.toThrow("CPF inválido.");
  });
});
