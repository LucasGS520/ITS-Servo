import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

const KEY = ["endereco_relatorios"] as const;
const rpcClient = supabase as unknown as {
  rpc: (name: string, args?: Record<string, string>) => Promise<{ data: string | null; error: Error | null }>;
};

export const useEnderecoRelatorios = () => useQuery({
  queryKey: KEY,
  queryFn: async () => {
    const { data, error } = await rpcClient.rpc("obter_endereco_relatorios");
    if (error) throw error;
    return data ?? "";
  },
});

export const useSalvarEnderecoRelatorios = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (endereco: string) => {
      const { data, error } = await rpcClient.rpc("atualizar_endereco_relatorios", { p_endereco: endereco });
      if (error) throw error;
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
};
