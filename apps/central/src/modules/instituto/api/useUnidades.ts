import { useNucleos } from "./nucleos";

export function useUnidades() {
  const consulta = useNucleos();
  const unidades = [...(consulta.data ?? []).map(n => ({ value: n.slug, label: n.nome, ativo: n.ativo })),
    { value: "correspondencia", label: "Correspondência", ativo: true }];
  return { ...consulta, unidades, labels: Object.fromEntries(unidades.map(n => [n.value, n.label])) };
}
