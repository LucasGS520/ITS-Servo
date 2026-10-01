import { describe, expect, it } from "vitest";
import {
  STATUS_INSCRICAO,
  STATUS_INSCRICAO_INFO,
  ehStatusInscricao,
  podeAlterarStatusInscricao,
  statusInscricaoOuPadrao,
} from "@/features/inscricoes/model";

describe("modelo de status da inscrição", () => {
  it("mantém os cinco status aceitos pelo banco", () => {
    expect(STATUS_INSCRICAO).toEqual([
      "aguardando_pagamento",
      "comprovante_enviado",
      "confirmada",
      "pagamento_nao_identificado",
      "cancelado",
    ]);
  });

  it("possui rótulos para gestão e autosserviço em todos os status", () => {
    for (const status of STATUS_INSCRICAO) {
      expect(STATUS_INSCRICAO_INFO[status].labelGestao).not.toBe("");
      expect(STATUS_INSCRICAO_INFO[status].labelAutosservico).not.toBe("");
    }
  });

  it("reconhece somente status canônicos", () => {
    expect(ehStatusInscricao("confirmada")).toBe(true);
    expect(ehStatusInscricao("em_analise")).toBe(false);
  });

  it("usa aguardando pagamento como fallback de status desconhecido", () => {
    expect(statusInscricaoOuPadrao("legado_desconhecido")).toBe(
      "aguardando_pagamento",
    );
  });

  it("preserva a política atual de permitir qualquer mudança de status", () => {
    expect(podeAlterarStatusInscricao("confirmada", "cancelado")).toBe(true);
    expect(podeAlterarStatusInscricao("confirmada", "confirmada")).toBe(false);
  });
});
