import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const INSCRICOES_KEY = ["inscricoes"] as const;

export const useInscricoes = () =>
  useQuery({
    queryKey: INSCRICOES_KEY,
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
