export const COMPROVANTE_MAX_BYTES = 5 * 1024 * 1024;

const TIPOS_ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type ValidacaoComprovante =
  | { valido: true }
  | { valido: false; motivo: "tamanho" | "tipo" };

/**
 * Mantém a regra de entrada do autosserviço no cliente, antes de enviar o
 * arquivo ao contrato server-side da Central.
 */
export function validarComprovante(file: Pick<File, "size" | "type">): ValidacaoComprovante {
  if (file.size > COMPROVANTE_MAX_BYTES) return { valido: false, motivo: "tamanho" };
  if (!TIPOS_ACEITOS.has(file.type)) return { valido: false, motivo: "tipo" };

  return { valido: true };
}
