import { describe, expect, it } from "vitest";
import { STATUS_INSCRICAO, STATUS_INSCRICAO_INFO, ehStatusInscricao, podeAlterarStatusInscricao, statusInscricaoOuPadrao } from "@/modules/matriculas/model";

describe("situações da inscrição", () => {
  it("mantém os estados aceitos pelo banco e rótulos administrativos", () => {
    expect(STATUS_INSCRICAO).toEqual(["em_analise", "comprovante_enviado", "confirmada", "pagamento_nao_identificado", "cancelado"]);
    for (const status of STATUS_INSCRICAO) expect(STATUS_INSCRICAO_INFO[status].labelGestao).not.toBe("");
    expect(ehStatusInscricao("em_analise")).toBe(true);
    expect(statusInscricaoOuPadrao("legado_desconhecido")).toBe("em_analise");
  });

  it("permite confirmar sem depender do pagamento e cancelar após confirmar", () => {
    expect(podeAlterarStatusInscricao("em_analise", "confirmada")).toBe(true);
    expect(podeAlterarStatusInscricao("comprovante_enviado", "confirmada")).toBe(true);
    expect(podeAlterarStatusInscricao("confirmada", "cancelado")).toBe(true);
    expect(podeAlterarStatusInscricao("cancelado", "confirmada")).toBe(false);
  });
});
