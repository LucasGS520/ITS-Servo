import { useSearchParams } from "react-router-dom";

/** Mantém o contexto entre abas e links sem apagar os demais filtros. */
export function useUrlFilter<T extends string = string>(key: string, fallback: T): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams();
  return [(params.get(key) ?? fallback) as T, value => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value === fallback) next.delete(key); else next.set(key, value);
    return next;
  }, { replace: true })];
}
