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
> & { curso_id?: string | null; edicao_simposio_id?: string | null };

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
    p_curso_id: values.curso_id ?? null,
    p_edicao_simposio_id: values.edicao_simposio_id ?? null,
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

export const emitirRelatorioMensal = async ({ periodo, dados }: { periodo: string; dados: Json }) => {
  const { error } = await supabase.rpc("emitir_relatorio_mensal", {
    p_periodo: periodo,
    p_dados: dados,
  });
  if (error) throw error;
};
