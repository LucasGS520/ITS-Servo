import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/services/supabase/client", () => ({
  supabase: {
    marcador: "cliente",
    rpc(this: { marcador: string }, nome: string) {
      if (this.marcador !== "cliente" || nome !== "obter_endereco_relatorios") throw new Error("RPC sem contexto do cliente");
      return Promise.resolve({ data: "Rua Via Taboão, 607", error: null });
    },
  },
}));

import { useEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";

describe("endereço dos relatórios", () => {
  it("consulta a função mantendo o contexto do cliente Supabase", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useEnderecoRelatorios(), { wrapper });
    await waitFor(() => expect(result.current.data).toBe("Rua Via Taboão, 607"));
    expect(result.current.isError).toBe(false);
  });
});
