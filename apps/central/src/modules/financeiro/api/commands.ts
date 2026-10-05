import { supabase } from "@/services/supabase/client";
import type { TablesInsert } from "@/services/supabase/types";
import type { Json } from "@its-servo/supabase/types";

export type AlunoValues = Pick<
  TablesInsert<"alunos">,
  "nome" | "unidade" | "observacoes" | "ativo"
>;

export type CategoriaValues = Pick<
  TablesInsert<"categorias_financeiras">,
  "nome" | "tipo" | "ativo"
>;

export type LancamentoValues = Pick<
  TablesInsert<"lancamentos_financeiros">,
  | "tipo"
  | "unidade"
  | "categoria_id"
  | "aluno_id"
  | "valor"
  | "data"
  | "competencia"
  | "descricao"
>;

interface SalvarInput<T> {
  id?: string;
  values: T;
}

export const salvarAluno = async ({ id, values }: SalvarInput<AlunoValues>) => {
  const { error } = id
    ? await supabase.from("alunos").update(values).eq("id", id)
    : await supabase.from("alunos").insert(values);

  if (error) throw error;
};

export const salvarCategoria = async ({
  id,
  values,
}: SalvarInput<CategoriaValues>) => {
  const { error } = id
    ? await supabase.from("categorias_financeiras").update(values).eq("id", id)
    : await supabase.from("categorias_financeiras").insert(values);

  if (error) throw error;
};

export const salvarLancamento = async ({
  id,
  values,
}: SalvarInput<LancamentoValues>) => {
  if (id) {
    throw new Error("Registros financeiros não são editados. Use Corrigir para preservar o histórico.");
  }

  const { error } = await supabase.rpc("criar_registro_financeiro", {
    p_tipo: values.tipo,
    p_valor: values.valor,
    p_data: values.data ?? new Date().toISOString().slice(0, 10),
    p_categoria_id: values.categoria_id,
    p_unidade: values.unidade ?? null,
    p_aluno_id: values.aluno_id ?? null,
    p_descricao: values.descricao ?? null,
    p_motivo: null,
    p_curso_id: null,
    p_edicao_simposio_id: null,
  });

  if (error) throw error;
};

export const excluirLancamento = async ({ id, motivo }: { id: string; motivo: string }) => {
  const { error } = await supabase.rpc("corrigir_registro_financeiro", {
    p_registro_id: id,
    p_motivo: motivo,
  });

  if (error) throw error;
};

export const conciliarPagamento = async ({ id, valor }: { id: string; valor: number }) => {
  const { error } = await supabase.rpc("conciliar_pagamento", {
    p_pagamento_id: id,
    p_valor: valor,
    p_data: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
};

export const recusarPagamento = async ({ id, motivo }: { id: string; motivo: string }) => {
  const { error } = await supabase.rpc("recusar_pagamento", {
    p_pagamento_id: id,
    p_motivo: motivo.trim(),
  });
  if (error) throw error;
};

export const estornarPagamento = async ({ id, motivo }: { id: string; motivo: string }) => {
  const { error } = await supabase.rpc("estornar_pagamento", {
    p_pagamento_id: id,
    p_motivo: motivo.trim(),
  });
  if (error) throw error;
};

export interface CobrancaValues {
  pessoa_id: string;
  inscricao_id?: string | null;
  curso_id?: string | null;
  edicao_simposio_id?: string | null;
  categoria_id?: string | null;
  referente: string;
  valor_devido: number;
  vencimento?: string | null;
  status?: string;
}

export const salvarCobranca = async ({ id, values }: SalvarInput<CobrancaValues>) => {
  const { error } = await supabase.rpc("salvar_cobranca", {
    p_cobranca_id: id ?? null,
    p_pessoa_id: values.pessoa_id,
    p_inscricao_id: values.inscricao_id ?? null,
    p_curso_id: values.curso_id ?? null,
    p_edicao_simposio_id: values.edicao_simposio_id ?? null,
    p_categoria_id: values.categoria_id ?? null,
    p_referente: values.referente,
    p_valor_devido: values.valor_devido,
    p_vencimento: values.vencimento ?? null,
    p_status: values.status ?? "aberta",
  });
  if (error) throw error;
};

export const emitirRelatorioMensal = async ({ periodo, dados }: { periodo: string; dados: Json }) => {
  const { error } = await supabase.rpc("emitir_relatorio_mensal", {
    p_periodo: periodo,
    p_dados: dados,
  });
  if (error) throw error;
};
