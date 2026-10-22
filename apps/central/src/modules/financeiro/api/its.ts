import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { fetchAllPages } from "@/common/lib/fetchAllPages";

export interface RecebimentoIts {
  id: string;
  inscricao_id: string | null;
  aluno_id: string | null;
  valor: number;
  data_recebimento: string | null;
  mes_caixa: string;
  precisao_data: "dia" | "mes";
  status: "confirmado" | "estornado";
  tipo: string;
  origem: string;
  comprovante_url: string | null;
}

export interface AtribuicaoMensalidade {
  id: string;
  recebimento_id: string;
  aluno_id: string;
  competencia: string;
  valor: number;
}

export const RECEBIMENTOS_ITS_KEY = ["recebimentos_its"] as const;
export const ATRIBUICOES_KEY = ["atribuicoes_mensalidade"] as const;

const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;

export const useRecebimentosIts = () => useQuery({
  queryKey: RECEBIMENTOS_ITS_KEY,
  queryFn: async () => {
    const data = await fetchAllPages((from, to) => supabase.from("recebimentos_its").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to));
    return data as unknown as RecebimentoIts[];
  },
});

export const useAtribuicoesMensalidade = () => useQuery({
  queryKey: ATRIBUICOES_KEY,
  queryFn: async () => {
    const data = await fetchAllPages((from, to) => supabase.from("atribuicoes_mensalidade").select("*").order("competencia", { ascending: false }).order("id", { ascending: false }).range(from, to));
    return data as unknown as AtribuicaoMensalidade[];
  },
});

export async function validarAlunoHistorico(input: {
  alunoId: string; nome: string; cpf: string; situacao: string; primeiraCompetencia: string | null;
}) {
  const { error } = await rpc("validar_aluno_historico", {
    p_aluno_id: input.alunoId, p_nome: input.nome, p_cpf: input.cpf,
    p_situacao: input.situacao, p_primeira_competencia: input.primeiraCompetencia,
  });
  if (error) throw error;
}
