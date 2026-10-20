import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { fetchAllPages } from "@/common/lib/fetchAllPages";

export type ItemSimposio = { id: string; edicao_id: string; descricao: string; tipo: string; valor: number | null; doador: string | null; contabilizado: boolean };

export const ITENS_SIMPOSIO_KEY = ["itens_simposio"] as const;

export const useItensSimposio = (edicaoId: string) => useQuery({
  queryKey: [...ITENS_SIMPOSIO_KEY, edicaoId],
  queryFn: async () => {
    const rows = await fetchAllPages((from, to) => supabase.from("itens_simposio").select("*").eq("edicao_id", edicaoId).order("created_at").order("id").range(from, to));
    return rows as unknown as ItemSimposio[];
  },
});

export async function adicionarDoacaoSimposio(edicaoId: string, descricao: string, doador: string | null) {
  const { error } = await supabase.from("itens_simposio").insert({
    edicao_id: edicaoId, tipo: "doacao_bem_servico", descricao, doador,
    valor: null, contabilizado: false,
  });
  if (error) throw error;
}
