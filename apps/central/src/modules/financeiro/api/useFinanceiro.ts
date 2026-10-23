import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/types";
import { fetchAllPages } from "@/common/lib/fetchAllPages";

export const ALUNOS_KEY = ["alunos"] as const;
export const CATEGORIAS_KEY = ["categorias_financeiras"] as const;
export const LANCAMENTOS_KEY = ["lancamentos_financeiros"] as const;

export type Aluno = Tables<"alunos">;
export type Categoria = Tables<"categorias_financeiras">;
export type Lancamento = Tables<"lancamentos_financeiros"> & {
  mes_caixa: string;
  precisao_data: "dia" | "mes";
  conciliacao_status: "conciliado" | "provisorio" | "divergente";
  aluno: { nome: string } | null;
  categoria: { nome: string; tipo: string } | null;
  inscricao_id: string | null;
  mes_referencia: string | null;
  comprovante_url: string | null;
  finalidade: "matricula" | "mensalidade" | "inscricao_evento" | "outro" | null;
  inscricao: { nome_completo: string; numero_inscricao: string } | null;
};

export const useAlunos = () =>
  useQuery({
    queryKey: ALUNOS_KEY,
    queryFn: async () => {
      return fetchAllPages((from, to) => supabase
        .from("alunos")
        .select("*")
        .order("nome")
        .order("id")
        .range(from, to));
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
      const data = await fetchAllPages((from, to) => supabase
        .from("lancamentos_financeiros")
        .select("*, aluno:alunos(nome), categoria:categorias_financeiras(nome,tipo), inscricao:inscricoes(nome_completo,numero_inscricao)")
        .order("mes_caixa", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to));
      return data as unknown as Lancamento[];
    },
    staleTime: 10_000,
  });

export const useSaldosIniciais = () => useQuery({
  queryKey: ["saldos_iniciais_its"],
  queryFn: async () => {
    const { data, error } = await supabase.from("saldos_iniciais_its").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as { ano: number; valor: number; fonte: string }[];
  },
});
export const usePendenciasConciliacao = () => useQuery({
  queryKey: ["pendencias_conciliacao"],
  queryFn: async () => {
    const { data, error } = await supabase.from("pendencias_conciliacao").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as { chave: string; descricao: string; status: string; valor_anual: number | null; valor_detalhe: number | null }[];
  },
});
