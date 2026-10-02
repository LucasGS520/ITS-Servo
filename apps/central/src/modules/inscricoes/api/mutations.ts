import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ALUNOS_KEY } from "@/modules/financeiro";
import { INSCRICOES_KEY } from "./useInscricoes";
import { atualizarStatusInscricao } from "./commands";

export const useAtualizarStatusInscricao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: atualizarStatusInscricao,
    onSuccess: async (_, { status }) => {
      const invalidacoes = [
        queryClient.invalidateQueries({ queryKey: INSCRICOES_KEY }),
      ];

      if (status === "confirmada") {
        invalidacoes.push(queryClient.invalidateQueries({ queryKey: ALUNOS_KEY }));
      }

      await Promise.all(invalidacoes);
    },
  });
};
