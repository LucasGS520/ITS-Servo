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

/** Transições administrativas; pedidos públicos de cancelamento são analisados separadamente. */
export const podeAlterarStatusInscricao = (atual: string, destino: StatusInscricao) =>
  (atual === "em_analise" && ["comprovante_enviado", "confirmada", "cancelado"].includes(destino))
  || (atual === "comprovante_enviado" && ["pagamento_nao_identificado", "confirmada", "cancelado"].includes(destino))
  || (atual === "pagamento_nao_identificado" && ["comprovante_enviado", "confirmada", "cancelado"].includes(destino))
  || (atual === "confirmada" && destino === "cancelado");
