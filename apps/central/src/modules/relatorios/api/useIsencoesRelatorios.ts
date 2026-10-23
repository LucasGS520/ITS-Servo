import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

type Isencao = { inscricao_id: string; finalidade: string; ativo: boolean };

export const useIsencoesRelatorios = () => useQuery({ queryKey: ["isencoes_inscricao", "relatorios"], queryFn: async () => {
  const { data, error } = await supabase.from("isencoes_inscricao" as "inscricoes").select("inscricao_id,finalidade,ativo") as unknown as { data: Isencao[] | null; error: Error | null };
  if (error) throw error;
  return data ?? [];
} });
