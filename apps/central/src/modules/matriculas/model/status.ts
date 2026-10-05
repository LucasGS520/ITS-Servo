export const STATUS_INSCRICAO = [
  "aguardando_pagamento",
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
  aguardando_pagamento: {
    labelGestao: "Aguardando Pagamento",
    labelAutosservico: "Aguardando Pagamento",
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
  ehStatusInscricao(status) ? status : "aguardando_pagamento";

/** Mantém a política atual da gestão: qualquer mudança para outro status é permitida. */
export const podeAlterarStatusInscricao = (atual: string, destino: StatusInscricao) =>
  (atual === "aguardando_pagamento" && destino === "cancelado")
  || (atual === "comprovante_enviado" && ["pagamento_nao_identificado", "cancelado"].includes(destino))
  || (atual === "pagamento_nao_identificado" && ["aguardando_pagamento", "cancelado"].includes(destino));
