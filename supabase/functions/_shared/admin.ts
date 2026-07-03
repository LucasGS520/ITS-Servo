/**
 * Client Supabase com service_role (bypassa RLS) — uso EXCLUSIVO server-side
 * dentro das edge functions. Nunca expor a service_role key ao browser.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente da função.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
