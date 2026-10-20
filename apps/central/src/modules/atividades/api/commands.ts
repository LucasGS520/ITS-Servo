import { supabase } from "@/services/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/services/supabase/types";

type EdicaoSimposioValues = Pick<TablesInsert<"edicoes_simposio">, "nome" | "inicio" | "fim" | "valor" | "ativo" | "publico">;

export const salvarCurso = async ({ id, values }: { id: string; values: TablesUpdate<"cursos"> & { taxa_matricula?: number | null; mensalidade_referencia?: number | null } }) => {
  const { error } = await supabase.from("cursos").update(values as TablesUpdate<"cursos">).eq("id", id);
  if (error) throw error;
};

export const salvarEdicaoSimposio = async ({ id, values }: { id?: string; values: EdicaoSimposioValues }) => {
  const { error } = id
    ? await supabase.from("edicoes_simposio").update(values).eq("id", id)
    : await supabase.from("edicoes_simposio").insert(values);
  if (error) throw error;
};
