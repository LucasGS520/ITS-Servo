import { afterEach, describe, expect, it, vi } from "vitest";
import { enderecoRelatorio } from "@/modules/relatorios/gestao/lib/enderecoRelatorio";
import { formatarReferencia, imprimirRelatorio } from "@/modules/relatorios/gestao/lib/imprimirRelatorio";
import type { Nucleo } from "@/modules/instituto/api";

afterEach(() => vi.restoreAllMocks());

describe("endereços de relatórios", () => {
  const nucleos = [{ slug: "engenho_novo", endereco: "Rua do Engenho, 100" }, { slug: "ariston", endereco: null }] as Nucleo[];

  it("usa a Sede apenas no consolidado, na Correspondência e no núcleo da Sede quando configurado", () => {
    expect(enderecoRelatorio(null, "Rua da Sede, 607", nucleos)).toBe("Rua da Sede, 607");
    expect(enderecoRelatorio("correspondencia", "Rua da Sede, 607", nucleos)).toBe("Rua da Sede, 607");
    expect(enderecoRelatorio("sede_jd_santa_monica", "Rua da Sede, 607", nucleos)).toBe("Rua da Sede, 607");
    expect(enderecoRelatorio("engenho_novo", "Rua da Sede, 607", nucleos)).toBe("Rua do Engenho, 100");
    expect(enderecoRelatorio("ariston", "Rua da Sede, 607", nucleos)).toBe("");
  });
});

describe("impressão", () => {
  it("exibe só a referência, o logo e dados do relatório, sem metadados ou avisos internos", () => {
    const write = vi.fn();
    const print = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({ document: { write, close: vi.fn(), querySelector: () => ({ complete: true }) }, focus: vi.fn(), print } as unknown as Window);
    const ok = imprimirRelatorio({ titulo: "Relatório financeiro geral", periodo: "2026-09", endereco: "Rua da Sede, 607", colunas: ["Histórico"], linhas: [["Curso"]], resumo: [{ rotulo: "Total", valor: "R$ 100,00" }], observacoes: ["Aviso interno de conciliação"] });
    const html = String(write.mock.calls[0][0]);
    expect(ok).toBe(true);
    expect(html).toContain("setembro de 2026");
    expect(html).toContain('alt="Logo do ITS"');
    expect(html).toContain("Rua da Sede, 607");
    expect(html).not.toContain("Gerado em");
    expect(html).not.toContain("Aviso interno de conciliação");
    expect(print).toHaveBeenCalledOnce();
  });

  it("formata o ano e preserva intervalos de meses já legíveis", () => {
    expect(formatarReferencia("2026")).toBe("Ano de 2026");
    expect(formatarReferencia("outubro de 2026 a novembro de 2026")).toBe("outubro de 2026 a novembro de 2026");
  });
});
