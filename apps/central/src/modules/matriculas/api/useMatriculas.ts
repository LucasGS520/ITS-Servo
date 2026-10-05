import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export const MATRICULAS_KEY = ["inscricoes"] as const;

export const useMatriculas = () =>
  useQuery({
    queryKey: MATRICULAS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscricoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });
