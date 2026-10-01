import { describe, expect, it } from "vitest";
import { COMPROVANTE_MAX_BYTES, validarComprovante } from "@/features/inscricoes/model";

describe("validação de comprovante no autosserviço", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "application/pdf"])(
    "aceita comprovante %s de até 5 MB",
    (type) => {
      expect(validarComprovante({ type, size: COMPROVANTE_MAX_BYTES })).toEqual({ valido: true });
    },
  );

  it("rejeita arquivo que ultrapassa 5 MB", () => {
    expect(validarComprovante({ type: "application/pdf", size: COMPROVANTE_MAX_BYTES + 1 })).toEqual({
      valido: false,
      motivo: "tamanho",
    });
  });

  it("rejeita tipo de arquivo fora da política operacional", () => {
    expect(validarComprovante({ type: "application/zip", size: 1024 })).toEqual({
      valido: false,
      motivo: "tipo",
    });
  });
});
