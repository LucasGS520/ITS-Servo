import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ALUNOS_KEY, COBRANCAS_KEY, PAGAMENTOS_KEY } from "@/modules/financeiro";
import { MATRICULAS_KEY } from "./useMatriculas";
import { atualizarStatusInscricao } from "./commands";

export const useAtualizarStatusInscricao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: atualizarStatusInscricao,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MATRICULAS_KEY }),
        queryClient.invalidateQueries({ queryKey: ALUNOS_KEY }),
        queryClient.invalidateQueries({ queryKey: COBRANCAS_KEY }),
        queryClient.invalidateQueries({ queryKey: PAGAMENTOS_KEY }),
      ]);
    },
  });
};
