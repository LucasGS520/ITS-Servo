import { afterEach, describe, expect, it, vi } from "vitest";
import { paramFromUrl } from "@/common/lib/urlToken";
import { SITE_URL, irParaSite, urlDoSite } from "@/common/constants/urls";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("fronteiras entre Site e Central", () => {
  it("prioriza o token no fragmento, sem enviá-lo na query da requisição", () => {
    window.history.replaceState({}, "", "/consulta?token=legado#token=seguro");

    expect(paramFromUrl("token")).toBe("seguro");
  });

  it("aceita token em query apenas para links antigos", () => {
    window.history.replaceState({}, "", "/consulta?token=legado");

    expect(paramFromUrl("token")).toBe("legado");
  });

  it("não inventa token quando o link não possui credencial", () => {
    window.history.replaceState({}, "", "/consulta");

    expect(paramFromUrl("token")).toBeNull();
  });

  it("redireciona uma rota institucional da Central ao Site", () => {
    const replace = vi.fn();

    irParaSite("/cursos", replace);

    expect(replace).toHaveBeenCalledWith(`${SITE_URL}/cursos`);
  });

  it("mantém o destino institucional previsível antes da navegação", () => {
    expect(urlDoSite("/quem-somos")).toBe(`${SITE_URL}/quem-somos`);
  });
});
