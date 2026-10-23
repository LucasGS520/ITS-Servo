import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import FinanceiroRelatorio from "../components/FinanceiroRelatorio";
import CursosRelatorio from "../components/CursosRelatorio";
import SimposiosRelatorio from "../components/SimposiosRelatorio";

const REPORT_KEYS = ["lancamentos_financeiros", "alunos", "inscricoes", "cursos", "edicoes_simposio", "saldos_iniciais_its", "pendencias_conciliacao", "isencoes_inscricao", "endereco_relatorios"];

export default function RelatoriosPage() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const tab = params.get("tab") === "simposios" ? "simposios" : ["cursos", "alunos"].includes(params.get("tab") ?? "") ? "cursos" : "financeiro";
  useEffect(() => {
    const atualizar = () => {
      if (document.visibilityState !== "visible") return;
      for (const key of REPORT_KEYS) void client.invalidateQueries({ queryKey: [key] });
    };
    atualizar();
    const intervalo = window.setInterval(atualizar, 30_000);
    document.addEventListener("visibilitychange", atualizar);
    window.addEventListener("focus", atualizar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", atualizar);
      window.removeEventListener("focus", atualizar);
    };
  }, [client]);
  return <div className="container space-y-6 py-8">
    <div><h1 className="text-2xl font-bold">Relatórios</h1><p className="mt-1 text-sm text-muted-foreground">Os dados são atualizados automaticamente. Corrija registros em Movimentações, Inscrições ou Instituto.</p></div>
    <Tabs value={tab} onValueChange={value => setParams({ tab: value })}><TabsList><TabsTrigger value="financeiro">Financeiro</TabsTrigger><TabsTrigger value="cursos">Cursos</TabsTrigger><TabsTrigger value="simposios">Simpósios</TabsTrigger></TabsList>
      <TabsContent value="financeiro" className="pt-4"><FinanceiroRelatorio /></TabsContent>
      <TabsContent value="cursos" className="pt-4"><CursosRelatorio /></TabsContent>
      <TabsContent value="simposios" className="pt-4"><SimposiosRelatorio /></TabsContent>
    </Tabs>
  </div>;
}
