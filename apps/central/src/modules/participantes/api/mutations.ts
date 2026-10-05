import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salvarPessoa } from "./commands";

export const useSalvarPessoa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salvarPessoa,
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pessoas"] }),
      queryClient.invalidateQueries({ queryKey: ["inscricoes"] }),
    ]),
  });
};
