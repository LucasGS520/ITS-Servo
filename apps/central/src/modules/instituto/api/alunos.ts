import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";
import { fetchAllPages } from "@/common/lib/fetchAllPages";
import type { Tables } from "@/services/supabase/types";
type Auditoria = Tables<"auditoria_operacional">;
export const usePessoasAlunos = () => useQuery({ queryKey: ["pessoas", "alunos"], queryFn: async () =>
  fetchAllPages((from, to) => supabase.from("pessoas").select("*").order("nome_completo").order("id").range(from, to)),
});

export const useAuditoriaAluno = (alunoId: string | undefined, pessoaId: string | null | undefined) => useQuery({
  queryKey: ["auditoria", "aluno", alunoId, pessoaId],
  enabled: Boolean(alunoId),
  queryFn: async () => {
    const [aluno, pessoa] = await Promise.all([
      supabase.from("auditoria_operacional").select("*").eq("entidade", "aluno").eq("entidade_id", alunoId!).order("created_at", { ascending: false }).limit(100),
      pessoaId ? supabase.from("auditoria_operacional").select("*").eq("entidade", "pessoa").eq("entidade_id", pessoaId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    ]);
    if (aluno.error) throw aluno.error;
    if (pessoa.error) throw pessoa.error;
    return [...(aluno.data ?? []), ...(pessoa.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)) as Auditoria[];
  },
});
