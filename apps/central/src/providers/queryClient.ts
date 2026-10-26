import { MutationCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: {
    staleTime: 10_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  }, mutations: { retry: false } },
  mutationCache: new MutationCache({ onSuccess: () => queryClient.invalidateQueries() }),
});
