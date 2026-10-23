import { describe, expect, it, vi } from "vitest";
import {
  criarInscricao,
  solicitarInscricao,
  listarDestinosPublicos,
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
      },
      error: null,
    });

    await expect(solicitarInscricao(makeClient(invoke), dto)).resolves.toEqual({
      numero_inscricao: "ITS2026-0001",
      token: "token-de-posse",
    });
    expect(invoke).toHaveBeenCalledWith("criar-inscricao", { body: dto });
  });

  it("preserva o alias técnico para consumidores ainda não migrados", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { numero_inscricao: "ITS2026-0002", token: "outro-token" },
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

describe("catálogo público", () => {
  it("expõe matrícula e mensalidade separadas e omite curso sem configuração", async () => {
    const cursos = [
      { id: "t", codigo: "teologico", nome: "Teológico", taxa_matricula: 40, mensalidade_referencia: 150 },
      { id: "c", codigo: "capacitacao_obreiros", nome: "Capacitação", taxa_matricula: null, mensalidade_referencia: null },
    ];
    const from = vi.fn((table: string) => ({
      select: vi.fn(() => {
        const result = { data: table === "cursos" ? cursos : [{ id: "s", nome: "Simpósio", valor: 70 }], error: null };
        return { eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue(result) })) };
      }),
    }));
    const destinos = await listarDestinosPublicos({ from } as never);
    expect(destinos).toEqual([
      { id: "t", tipo: "curso", codigo: "teologico", nome: "Teológico", taxa_matricula: 40, mensalidade_referencia: 150 },
      { id: "s", tipo: "simposio", nome: "Simpósio", valor: 70 },
    ]);
    expect(from).toHaveBeenCalledWith("cursos");
    expect(from).toHaveBeenCalledWith("edicoes_simposio");
  });
});
