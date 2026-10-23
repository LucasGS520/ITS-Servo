import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { LANCAMENTOS_KEY } from "./useFinanceiro";

export interface MovimentacaoInput {
  id: string | null;
  tipo: "entrada" | "saida";
  valor: number;
  data: string | null;
  mesCaixa: string;
  categoriaId: string;
  unidade: string | null;
  cursoId: string | null;
  edicaoId: string | null;
  inscricaoId: string | null;
  alunoHistoricoId: string | null;
  finalidade: "matricula" | "mensalidade" | "inscricao_evento" | "outro" | null;
  mesReferencia: string | null;
  comprovanteUrl: string | null;
  descricao: string | null;
}

const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;

export async function salvarMovimentacao(input: MovimentacaoInput) {
  const { error } = await rpc("salvar_movimentacao_its", {
    p_id: input.id, p_tipo: input.tipo, p_valor: input.valor,
    p_data: input.data, p_mes_caixa: `${input.mesCaixa}-01`,
    p_categoria_id: input.categoriaId, p_unidade: input.unidade,
    p_curso_id: input.cursoId, p_edicao_simposio_id: input.edicaoId,
    p_inscricao_id: input.inscricaoId, p_aluno_historico_id: input.alunoHistoricoId,
    p_finalidade: input.finalidade, p_mes_referencia: input.mesReferencia ? `${input.mesReferencia}-01` : null,
    p_comprovante_url: input.comprovanteUrl, p_descricao: input.descricao,
  });
  if (error) throw error;
}

export async function devolverMovimentacao(input: { id: string; valor: number; data: string; categoriaId: string; descricao: string | null }) {
  const { error } = await rpc("devolver_movimentacao_its", {
    p_entrada_id: input.id, p_valor: input.valor, p_data: input.data,
    p_categoria_id: input.categoriaId, p_descricao: input.descricao,
  });
  if (error) throw error;
}

export async function enviarComprovanteFinanceiro(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("O comprovante deve ter até 10 MB.");
  if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Use PDF, JPG, PNG ou WebP.");
  }
  const extensao = file.type === "application/pdf" ? "pdf" : file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `financeiro/${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from("comprovantes").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function removerComprovanteFinanceiro(path: string) {
  await supabase.storage.from("comprovantes").remove([path]);
}

const invalidate = async (client: ReturnType<typeof useQueryClient>) => {
  await client.invalidateQueries({ queryKey: LANCAMENTOS_KEY });
};

export const useSalvarMovimentacao = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: salvarMovimentacao, onSuccess: () => invalidate(client) });
};

export const useDevolverMovimentacao = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: devolverMovimentacao, onSuccess: () => invalidate(client) });
};
