import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export const useCursos = () => useQuery({
  queryKey: ["cursos"],
  queryFn: async () => {
    const { data, error } = await supabase.from("cursos").select("*").order("nome");
    if (error) throw error;
    return data ?? [];
  },
});

export const useEdicoesSimposio = () => useQuery({
  queryKey: ["edicoes_simposio"],
  queryFn: async () => {
    const { data, error } = await supabase.from("edicoes_simposio").select("*").order("inicio", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});
