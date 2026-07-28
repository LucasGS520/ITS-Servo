import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "./types.ts";

/** Client tipado da plataforma — tabelas e RPCs checadas em compile-time. */
export type SupabaseClient = SupabaseClientBase<Database>;

/**
 * Fábrica do client de browser. Cada app passa suas próprias variáveis de
 * ambiente (Astro usa PUBLIC_*, Vite usa VITE_*), evitando acoplar o pacote a
 * um bundler específico.
 */
export function createBrowserClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("createBrowserClient: url e anonKey são obrigatórios.");
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
