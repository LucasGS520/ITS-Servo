/**
 * FONTE ÚNICA da lista de núcleos da plataforma.
 *
 * Consumida por: apps/site (formulário, páginas e mapa), apps/central
 * (formulário de inscrição) e — por cópia sincronizada, já que o bundle das
 * edge functions não enxerga o workspace — supabase/functions/_shared/nucleos.ts.
 * Ao alterar aqui, atualize também a cópia do _shared.
 *
 * `value` é o slug persistido em `inscricoes.nucleo` — NUNCA renomear sem
 * migração de dados.
 */
export interface Nucleo {
  value: string;
  nome: string;
  cidade: string; // "Cidade/UF"
  ref: string;
  lat: number;
  lng: number;
}

export const NUCLEOS: Nucleo[] = [
  {
    value: "sede_jd_santa_monica",
    nome: "Sede Jd. Santa Mônica",
    cidade: "Barueri/SP",
    ref: "Assembleia de Deus Ministério Família",
    lat: -23.509,
    lng: -46.876,
  },
  {
    value: "engenho_novo",
    nome: "Engenho Novo",
    cidade: "Barueri/SP",
    ref: "Assembleia de Deus Ministério Família",
    lat: -23.523,
    lng: -46.869,
  },
  {
    value: "jd_conceicao",
    nome: "Jd. Conceição",
    cidade: "Osasco/SP",
    ref: "Assembleia de Deus Ministério Família",
    lat: -23.532,
    lng: -46.792,
  },
  {
    value: "ariston",
    nome: "Ariston",
    cidade: "Carapicuíba/SP",
    ref: "Assembleia de Deus Ministério Família",
    lat: -23.528,
    lng: -46.836,
  },
];

/** Opções de formulário (modalidade presencial). */
export const NUCLEO_OPTIONS = NUCLEOS.map((n) => ({
  value: n.value,
  label: `${n.nome} (${n.cidade})`,
}));

/** Rótulo de exibição por slug (e-mails, painel). */
export const NUCLEO_LABELS: Record<string, string> = Object.fromEntries(
  NUCLEOS.map((n) => [n.value, `${n.nome} — ${n.cidade}`]),
);
