import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export interface IsencaoInscricao {
  id: string; inscricao_id: string; finalidade: "matricula" | "mensalidade" | "inscricao_evento";
  mes_referencia: string | null; motivo: string; ativo: boolean; created_at: string;
}
export interface PedidoCancelamento {
  id: string; inscricao_id: string; status: "pendente" | "aprovada" | "rejeitada";
  solicitada_em: string; resolvida_em: string | null; motivo: string | null;
}
export interface EventoInscricao {
  id: string; entidade_id: string; acao: string; motivo: string | null;
  dados: Record<string, unknown>; created_at: string; executado_por: string | null;
}
export interface ComprovanteInscricao { id: string; inscricao_id: string; caminho: string; origem: string; created_at: string }

export const FICHA_INSCRICAO_KEY = ["ficha-inscricao"] as const;
export const ISENCOES_INSCRICAO_KEY = ["isencoes-inscricao"] as const;

export const useIsencoesInscricao = () => useQuery({
  queryKey: ISENCOES_INSCRICAO_KEY,
  queryFn: async () => {
    const { data, error } = await supabase.from("isencoes_inscricao" as never).select("*");
    if (error) throw error;
    return (data ?? []) as unknown as IsencaoInscricao[];
  },
});

export const usePedidosCancelamento = () => useQuery({
  queryKey: ["pedidos-cancelamento-inscricao"],
  queryFn: async () => {
    const { data, error } = await supabase.from("solicitacoes_cancelamento_inscricao" as never).select("*");
    if (error) throw error;
    return (data ?? []) as unknown as PedidoCancelamento[];
  },
});

export const useFichaInscricao = (id: string | null) => useQuery({
  queryKey: [...FICHA_INSCRICAO_KEY, id], enabled: Boolean(id),
  queryFn: async () => {
    const [isencoes, pedidos, auditoria, comprovantes] = await Promise.all([
      supabase.from("isencoes_inscricao" as never).select("*").eq("inscricao_id", id!).order("created_at", { ascending: false }),
      supabase.from("solicitacoes_cancelamento_inscricao" as never).select("*").eq("inscricao_id", id!).order("solicitada_em", { ascending: false }),
      supabase.from("auditoria_operacional").select("id,entidade_id,acao,motivo,dados,created_at,executado_por")
        .eq("entidade", "matricula").eq("entidade_id", id!).order("created_at", { ascending: false }).limit(50),
      supabase.from("comprovantes_inscricao" as never).select("*").eq("inscricao_id", id!).order("created_at", { ascending: false }),
    ]);
    if (isencoes.error) throw isencoes.error;
    if (pedidos.error) throw pedidos.error;
    if (auditoria.error) throw auditoria.error;
    if (comprovantes.error) throw comprovantes.error;
    return { isencoes: (isencoes.data ?? []) as unknown as IsencaoInscricao[],
      pedidos: (pedidos.data ?? []) as unknown as PedidoCancelamento[],
      auditoria: (auditoria.data ?? []) as unknown as EventoInscricao[],
      comprovantes: (comprovantes.data ?? []) as unknown as ComprovanteInscricao[] };
  },
});
