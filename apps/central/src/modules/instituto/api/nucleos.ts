import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export type Nucleo = { id: string; slug: string; nome: string; cidade: string; uf: string; endereco: string | null; ativo: boolean };
export type NucleoValues = Omit<Nucleo, "id" | "slug"> & { slug?: string };
export const NUCLEOS_KEY = ["nucleos"] as const;

export const useNucleos = () => useQuery({ queryKey: NUCLEOS_KEY, queryFn: async () => {
  const { data, error } = await supabase.from("nucleos").select("id,slug,nome,cidade,uf,endereco,ativo").order("nome");
  if (error) throw error;
  return (data ?? []) as Nucleo[];
}});

const salvarNucleo = async ({ id, values }: { id?: string; values: NucleoValues }) => {
  const { error } = id ? await supabase.from("nucleos").update(values).eq("id", id) : await supabase.from("nucleos").insert(values as Required<NucleoValues>);
  if (error) throw error;
};

export const useSalvarNucleo = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: salvarNucleo, onSuccess: () => queryClient.invalidateQueries({ queryKey: NUCLEOS_KEY }) });
};
