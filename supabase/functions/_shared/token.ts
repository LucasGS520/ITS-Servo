/**
 * Token de autosserviço por inscrição.
 * Gera um token aleatório (retornado ao dono, só uma vez) e o hash sha256 hex
 * que é o que fica no banco (`consulta_token_hash`). O hash tem que bater com o
 * do Postgres: encode(digest(token,'sha256'),'hex').
 */
export function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
