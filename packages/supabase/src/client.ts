import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Fábrica do client de browser. Cada app passa suas próprias variáveis de
 * ambiente (Astro usa PUBLIC_*, Vite usa VITE_*), evitando acoplar o pacote a
 * um bundler específico.
 */
export function createBrowserClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("createBrowserClient: url e anonKey são obrigatórios.");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export type { SupabaseClient };
