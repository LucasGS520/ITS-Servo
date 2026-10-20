export const STATUS_INSCRICAO = [
  "em_analise",
  "comprovante_enviado",
  "confirmada",
  "pagamento_nao_identificado",
  "cancelado",
] as const;

export type StatusInscricao = (typeof STATUS_INSCRICAO)[number];

export const STATUS_INSCRICAO_INFO: Record<
  StatusInscricao,
  { labelGestao: string; labelAutosservico: string }
> = {
  em_analise: {
    labelGestao: "Em análise",
    labelAutosservico: "Em análise pela equipe",
  },
  comprovante_enviado: {
    labelGestao: "Comprovante Enviado",
    labelAutosservico: "Comprovante Enviado",
  },
  confirmada: {
    labelGestao: "Confirmada",
    labelAutosservico: "Matrícula Confirmada",
  },
  pagamento_nao_identificado: {
    labelGestao: "Pag. Não Identificado",
    labelAutosservico: "Pagamento Não Identificado",
  },
  cancelado: {
    labelGestao: "Cancelada",
    labelAutosservico: "Cancelada",
  },
};

export const ehStatusInscricao = (status: string): status is StatusInscricao =>
  STATUS_INSCRICAO.includes(status as StatusInscricao);

export const statusInscricaoOuPadrao = (status: string): StatusInscricao =>
  ehStatusInscricao(status) ? status : "em_analise";

/** Mantém a política atual da gestão: qualquer mudança para outro status é permitida. */
export const podeAlterarStatusInscricao = (atual: string, destino: StatusInscricao) =>
  (atual === "em_analise" && destino === "cancelado")
  || (atual === "comprovante_enviado" && ["pagamento_nao_identificado", "cancelado"].includes(destino))
  || (atual === "pagamento_nao_identificado" && ["em_analise", "cancelado"].includes(destino));
