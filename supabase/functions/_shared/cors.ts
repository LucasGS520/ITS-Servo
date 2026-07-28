/**
 * CORS compartilhado das edge functions.
 * Restringe origens via env `ALLOWED_ORIGINS` (lista separada por vírgula).
 * Sem fallback silencioso: env ausente falha o cold start com mensagem clara.
 * Em desenvolvimento local, defina explicitamente `ALLOWED_ORIGINS=*` em
 * supabase/functions/.env.
 */
const rawAllowed = Deno.env.get("ALLOWED_ORIGINS");
if (!rawAllowed) {
  throw new Error(
    "ALLOWED_ORIGINS não configurada (lista de origens separada por vírgula, ou '*' explicitamente em dev). Defina via `supabase secrets set`.",
  );
}
const allowed = rawAllowed
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

const NULL_BODY_STATUSES = [101, 204, 205, 304];

export function json(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  if (NULL_BODY_STATUSES.includes(status)) {
    return new Response(null, { status, headers: corsHeaders(origin) });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
