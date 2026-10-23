import type { Nucleo } from "@/modules/instituto/api";

/** Correspondência não é núcleo físico; seus relatórios usam o endereço da Sede. */
export function enderecoRelatorio(unidade: string | null, sede: string, nucleos: Nucleo[]): string {
  if (!unidade || unidade === "correspondencia" || unidade === "sede_jd_santa_monica") return sede;
  return nucleos.find(n => n.slug === unidade)?.endereco?.trim() ?? "";
}
