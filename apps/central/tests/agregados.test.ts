import { describe, expect, it } from "vitest";
import type { Lancamento } from "@/modules/financeiro/api";
import { saldoAcumulado, saldoAnterior } from "@/modules/financeiro/model/agregados";

const lancamentos = [
  { mes_caixa: "2026-01-01", tipo: "entrada", valor: 22350 },
  { mes_caixa: "2026-09-01", tipo: "saida", valor: 10787.99 },
  { mes_caixa: "2027-01-01", tipo: "entrada", valor: 100 },
] as Lancamento[];

describe("transporte de saldo", () => {
  it("leva o saldo inicial de 2026 para o ano seguinte", () => {
    const saldos = [{ ano: 2026, valor: 13067.29 }];
    expect(saldoAcumulado(lancamentos, "2026-09-01", saldos)).toBe(24629.3);
    expect(saldoAnterior(lancamentos, "2027-01-01", saldos)).toBe(24629.3);
    expect(saldoAcumulado(lancamentos, "2027-01-01", saldos)).toBe(24729.3);
  });

  it("usa uma nova abertura como substituição, sem dupla contagem", () => {
    const saldos = [{ ano: 2026, valor: 13067.29 }, { ano: 2027, valor: 25000 }];
    expect(saldoAnterior(lancamentos, "2027-01-01", saldos)).toBe(25000);
    expect(saldoAcumulado(lancamentos, "2027-01-01", saldos)).toBe(25100);
  });
});
