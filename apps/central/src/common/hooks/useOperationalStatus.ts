import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useOperationalStatus(keys: string[]) {
  const client = useQueryClient();
  const cache = client.getQueryCache();
  const state = useSyncExternalStore(
    callback => cache.subscribe(callback),
    () => {
      const queries = cache.getAll().filter(q => keys.includes(String(q.queryKey[0])) && q.isActive());
      const missing = queries.some(q => q.state.data === undefined);
      if (queries.some(q => q.state.status === "error")) return missing ? "error" : "stale";
      if (missing) return "loading";
      return "ready";
    },
  );
  return { bloqueado: state !== "ready", erro: state === "error" || state === "stale", carregando: state === "loading", semDados: state === "error" || state === "loading" };
}
