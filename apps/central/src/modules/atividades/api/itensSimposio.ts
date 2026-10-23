import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { fetchAllPages } from "@/common/lib/fetchAllPages";

export type ItemSimposio = { id: string; edicao_id: string; descricao: string; tipo: string; valor: number | null; doador: string | null; contabilizado: boolean; origem_referencia: string | null; quantidade: number | null; unidade_medida: string | null; data_recebimento: string | null; situacao_doacao: "prometida" | "recebida" | null };

export const ITENS_SIMPOSIO_KEY = ["itens_simposio"] as const;

export const useItensSimposio = (edicaoId: string) => useQuery({
  queryKey: [...ITENS_SIMPOSIO_KEY, edicaoId],
  queryFn: async () => {
    const rows = await fetchAllPages((from, to) => supabase.from("itens_simposio").select("*").eq("edicao_id", edicaoId).order("created_at").order("id").range(from, to));
    return rows as unknown as ItemSimposio[];
  },
});

export type DoacaoInput = Pick<ItemSimposio, "descricao" | "doador" | "quantidade" | "unidade_medida" | "data_recebimento" | "situacao_doacao">;

export async function salvarDoacaoSimposio(edicaoId: string, input: DoacaoInput, itemId?: string) {
  const values = { ...input, edicao_id: edicaoId, tipo: "doacao_bem_servico", valor: null, contabilizado: false };
  const { error } = itemId
    ? await supabase.from("itens_simposio").update(values).eq("id", itemId).eq("edicao_id", edicaoId).eq("tipo", "doacao_bem_servico")
    : await supabase.from("itens_simposio").insert(values);
  if (error) throw error;
}
