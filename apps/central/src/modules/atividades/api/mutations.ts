import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salvarCurso, salvarEdicaoSimposio } from "./commands";

export const useSalvarCurso = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: salvarCurso, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cursos"] }) });
};

export const useSalvarEdicaoSimposio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salvarEdicaoSimposio,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["edicoes_simposio"] }),
      queryClient.invalidateQueries({ queryKey: ["inscricoes"] }),
    ]),
  });
};
