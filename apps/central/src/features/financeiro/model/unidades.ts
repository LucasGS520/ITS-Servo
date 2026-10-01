import { NUCLEOS } from "@its-servo/supabase";

/**
 * Unidades do módulo financeiro: os 4 núcleos (fonte única do monorepo) +
 * Correspondência, que no cadastro é modalidade mas no financeiro é uma
 * unidade de relatório (como na planilha).
 */
export interface UnidadeFinanceiro {
  value: string;
  label: string;
}

export const UNIDADES_FINANCEIRO: UnidadeFinanceiro[] = [
  ...NUCLEOS.map((n) => ({ value: n.value, label: n.nome })),
  { value: "correspondencia", label: "Correspondência" },
];

export const UNIDADE_LABELS: Record<string, string> = Object.fromEntries(
  UNIDADES_FINANCEIRO.map((u) => [u.value, u.label]),
);
