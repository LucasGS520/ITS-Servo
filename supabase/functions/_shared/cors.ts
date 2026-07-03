/**
 * CORS compartilhado das edge functions.
 * Restringe origens via env `ALLOWED_ORIGINS` (lista separada por vírgula).
 * Default "*" para desenvolvimento — DEFINIR as origens reais no deploy (Fase 6).
 */
const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = allowed.includes("*")
    ? "*"
    : origin && allowed.includes(origin)
      ? origin
      : (allowed[0] ?? "*");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
