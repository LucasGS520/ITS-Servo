import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase/client";

export const usePessoasComHistorico = () => useQuery({
  queryKey: ["pessoas", "historico"],
  queryFn: async () => {
    const [pessoas, cursos, inscricoes] = await Promise.all([
      supabase.from("pessoas").select("*").order("nome_completo"),
      supabase.from("cursos").select("id,codigo,nome"),
      supabase.from("inscricoes").select("pessoa_id,curso_id,edicao_simposio_id,status"),
    ]);
    if (pessoas.error) throw pessoas.error;
    if (cursos.error) throw cursos.error;
    if (inscricoes.error) throw inscricoes.error;
    return { pessoas: pessoas.data, cursos: cursos.data, inscricoes: inscricoes.data };
  },
});
