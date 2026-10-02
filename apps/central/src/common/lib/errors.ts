/** Returns a safe, user-facing message without relying on `any` in UI flows. */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Extracts database-style error codes only when the received value has one. */
export function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = error.code;
  return typeof code === "string" ? code : null;
}
