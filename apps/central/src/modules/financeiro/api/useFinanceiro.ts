import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";

export const ALUNOS_KEY = ["alunos"] as const;
export const CATEGORIAS_KEY = ["categorias_financeiras"] as const;
export const LANCAMENTOS_KEY = ["lancamentos_financeiros"] as const;

export type Aluno = Tables<"alunos">;
export type Categoria = Tables<"categorias_financeiras">;
export type Lancamento = Tables<"lancamentos_financeiros"> & {
  aluno: { nome: string } | null;
  categoria: { nome: string; tipo: string } | null;
};

export const useAlunos = () =>
  useQuery({
    queryKey: ALUNOS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export const useCategorias = () =>
  useQuery({
    queryKey: CATEGORIAS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .order("tipo")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

/**
 * Busca TODOS os lançamentos: o volume é pequeno (uma planilha anual) e o
 * saldo acumulado/"saldo anterior" precisa do histórico completo de qualquer
 * forma. Agregações são feitas client-side (ver financeiro/agregados.ts).
 */
export const useLancamentos = () =>
  useQuery({
    queryKey: LANCAMENTOS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos_financeiros")
        .select("*, aluno:alunos(nome), categoria:categorias_financeiras(nome,tipo)")
        .order("competencia", { ascending: false })
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lancamento[];
    },
    staleTime: 10_000,
  });
