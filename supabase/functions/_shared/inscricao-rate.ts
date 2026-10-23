import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

export async function limitarInteracaoInscricao(client: SupabaseClient, req: Request, acao: string, limite: number): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  const janela = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await client.from("interacoes_inscricao_hits")
    .select("id", { count: "exact", head: true }).eq("ip", ip).eq("acao", acao).gte("created_at", janela);
  if (error || (count ?? limite) >= limite) return false;
  const { error: insertError } = await client.from("interacoes_inscricao_hits").insert({ ip, acao });
  return !insertError;
}
