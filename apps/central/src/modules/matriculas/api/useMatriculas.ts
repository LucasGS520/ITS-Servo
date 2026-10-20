import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { fetchAllPages } from "@/common/lib/fetchAllPages";

export const MATRICULAS_KEY = ["inscricoes"] as const;

export const useMatriculas = () =>
  useQuery({
    queryKey: MATRICULAS_KEY,
    queryFn: async () => {
      return fetchAllPages((from, to) => supabase
        .from("inscricoes")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to));
    },
    staleTime: 10_000,
  });
