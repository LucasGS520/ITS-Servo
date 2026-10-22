import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ALUNOS_KEY,
  CATEGORIAS_KEY,
} from "./useFinanceiro";
import {
  emitirRelatorioMensal,
  salvarAluno,
  salvarCategoria,
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

export const useEmitirRelatorioMensal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emitirRelatorioMensal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["relatorios_mensais_versoes"] }),
  });
};
