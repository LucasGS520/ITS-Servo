/**
 * Client Supabase com secret key (bypassa RLS) — uso EXCLUSIVO server-side
 * dentro das edge functions. Nunca expor uma secret/service_role key ao browser.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

function platformKey(currentName: string, legacyName: string): string | undefined {
  const current = Deno.env.get(currentName);
  if (current) {
    try {
      const key = (JSON.parse(current) as Record<string, unknown>).default;
      if (typeof key === "string" && key) return key;
    } catch {
      throw new Error(`${currentName} inválida: esperada uma lista JSON de chaves do Supabase.`);
    }
  }
  return Deno.env.get(legacyName);
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = platformKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEYS ausentes no ambiente da função.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Client no contexto do CHAMADOR (publishable key + Authorization repassado) —
 * respeita RLS e permite RPCs como `is_admin` avaliarem o usuário real.
 */
export function callerClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = platformKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  if (!url || !anon) {
    throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEYS ausentes no ambiente da função.");
  }
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}
