import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

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
  const { error } = id
    ? await supabase.from("lancamentos_financeiros").update(values).eq("id", id)
    : await supabase.from("lancamentos_financeiros").insert(values);

  if (error) throw error;
};

export const excluirLancamento = async (id: string) => {
  const { error } = await supabase
    .from("lancamentos_financeiros")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
