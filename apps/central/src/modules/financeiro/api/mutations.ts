import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ALUNOS_KEY,
  CATEGORIAS_KEY,
  LANCAMENTOS_KEY,
} from "./useFinanceiro";
import {
  excluirLancamento,
  salvarAluno,
  salvarCategoria,
  salvarLancamento,
} from "./commands";

const useInvalidatingMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
  queryKey: readonly string[],
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
};

export const useSalvarAluno = () =>
  useInvalidatingMutation(salvarAluno, ALUNOS_KEY);

export const useSalvarCategoria = () =>
  useInvalidatingMutation(salvarCategoria, CATEGORIAS_KEY);

export const useSalvarLancamento = () =>
  useInvalidatingMutation(salvarLancamento, LANCAMENTOS_KEY);

export const useExcluirLancamento = () =>
  useInvalidatingMutation(excluirLancamento, LANCAMENTOS_KEY);
