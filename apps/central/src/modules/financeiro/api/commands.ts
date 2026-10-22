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

export const emitirRelatorioMensal = async ({ periodo, dados }: { periodo: string; dados: Json }) => {
  const { error } = await supabase.rpc("emitir_relatorio_mensal", {
    p_periodo: periodo,
    p_dados: dados,
  });
  if (error) throw error;
};
