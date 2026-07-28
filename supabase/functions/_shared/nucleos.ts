/**
 * CÓPIA SINCRONIZADA de packages/supabase/src/nucleos.ts (fonte única).
 * O bundle das edge functions (Deno/eszip) não enxerga o workspace pnpm,
 * por isso a lista vive aqui em duplicata mínima. Ao alterar os núcleos,
 * atualize os DOIS arquivos.
 */
export const NUCLEO_LABELS: Record<string, string> = {
  sede_jd_santa_monica: "Sede Jd. Santa Mônica — Barueri/SP",
  engenho_novo: "Engenho Novo — Barueri/SP",
  jd_conceicao: "Jd. Conceição — Osasco/SP",
  ariston: "Ariston — Carapicuíba/SP",
};

export const NUCLEO_SLUGS = Object.keys(NUCLEO_LABELS);
