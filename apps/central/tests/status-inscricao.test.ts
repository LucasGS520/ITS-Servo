import { describe, expect, it } from "vitest";
import { STATUS_INSCRICAO, STATUS_INSCRICAO_INFO, ehStatusInscricao, podeAlterarStatusInscricao, statusInscricaoOuPadrao } from "@/modules/matriculas/model";

describe("modelo de status da matrícula", () => {
  it("mantém os cinco status aceitos pelo banco", () => {
    expect(STATUS_INSCRICAO).toEqual(["aguardando_pagamento", "comprovante_enviado", "confirmada", "pagamento_nao_identificado", "cancelado"]);
  });

  it("possui rótulos para gestão e autosserviço", () => {
    for (const status of STATUS_INSCRICAO) {
      expect(STATUS_INSCRICAO_INFO[status].labelGestao).not.toBe("");
      expect(STATUS_INSCRICAO_INFO[status].labelAutosservico).not.toBe("");
    }
  });

  it("reconhece somente status canônicos e aplica fallback", () => {
    expect(ehStatusInscricao("confirmada")).toBe(true);
    expect(ehStatusInscricao("em_analise")).toBe(false);
    expect(statusInscricaoOuPadrao("legado_desconhecido")).toBe("aguardando_pagamento");
  });

  it("impede confirmação manual e saída de uma matrícula confirmada", () => {
    expect(podeAlterarStatusInscricao("comprovante_enviado", "confirmada")).toBe(false);
    expect(podeAlterarStatusInscricao("confirmada", "cancelado")).toBe(false);
  });

  it("permite somente exceções operacionais explícitas", () => {
    expect(podeAlterarStatusInscricao("comprovante_enviado", "pagamento_nao_identificado")).toBe(true);
    expect(podeAlterarStatusInscricao("pagamento_nao_identificado", "aguardando_pagamento")).toBe(true);
    expect(podeAlterarStatusInscricao("aguardando_pagamento", "cancelado")).toBe(true);
  });
});
