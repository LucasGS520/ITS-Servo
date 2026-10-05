/** Identidade de recebimento — alterar aqui reflete em toda a UI de pagamento. */
export const PIX = {
  CHAVE_EXIBICAO: "20.424.935/0001-02",
  CHAVE_COPIA: "20424935000102",
  FAVORECIDO: "Instituto Teológico Servo",
  BANCO: "Cora",
} as const;

export const formatBRL = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
