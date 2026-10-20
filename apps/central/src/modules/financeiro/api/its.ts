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

export async function registrarRecebimentoIts(input: {
  inscricaoId: string; valor: number; data: string; tipo: string;
  atribuicoes: { competencia: string; valor: number }[];
  comprovante?: string | null;
}) {
  const { error } = await rpc("registrar_recebimento_its", {
    p_inscricao_id: input.inscricaoId, p_valor: input.valor, p_data: input.data,
    p_tipo: input.tipo, p_atribuicoes: input.atribuicoes, p_comprovante: input.comprovante ?? null,
  });
  if (error) throw error;
}

export async function estornarRecebimentoIts(id: string, motivo: string) {
  const { error } = await rpc("estornar_recebimento_its", { p_recebimento_id: id, p_motivo: motivo });
  if (error) throw error;
}

export async function atribuirMensalidadeIts(id: string, competencia: string, valor: number) {
  const { error } = await rpc("atribuir_mensalidade_its", { p_recebimento_id: id, p_competencia: competencia, p_valor: valor });
  if (error) throw error;
}

export async function retirarAtribuicaoIts(id: string, motivo: string) {
  const { error } = await rpc("retirar_atribuicao_its", { p_atribuicao_id: id, p_motivo: motivo });
  if (error) throw error;
}

export async function validarAlunoHistorico(input: {
  alunoId: string; nome: string; cpf: string; situacao: string; primeiraCompetencia: string | null;
}) {
  const { error } = await rpc("validar_aluno_historico", {
    p_aluno_id: input.alunoId, p_nome: input.nome, p_cpf: input.cpf,
    p_situacao: input.situacao, p_primeira_competencia: input.primeiraCompetencia,
  });
  if (error) throw error;
}
