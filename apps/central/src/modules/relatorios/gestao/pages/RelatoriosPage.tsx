import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/common/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import FinanceiroRelatorio from "../components/FinanceiroRelatorio";
import CursosRelatorio from "../components/CursosRelatorio";
import SimposiosRelatorio from "../components/SimposiosRelatorio";
import { useEnderecoRelatorios } from "@/modules/relatorios/api/useEnderecoRelatorios";

export default function RelatoriosPage() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const { data: endereco, isError: erroEndereco } = useEnderecoRelatorios();
  const tab = params.get("tab") === "simposios" ? "simposios" : ["cursos", "alunos"].includes(params.get("tab") ?? "") ? "cursos" : "financeiro";
  return <div className="container space-y-6 py-8">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Relatórios</h1><p className="mt-1 text-sm text-muted-foreground">Confira os dados atuais e imprima. Correções são feitas em Movimentações, Inscrições ou Instituto.</p></div><Button variant="outline" onClick={() => void client.invalidateQueries()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar dados</Button></div>
    {erroEndereco && <p className="text-destructive">Não foi possível carregar o endereço dos relatórios. Confira a migração do banco.</p>}
    {!erroEndereco && endereco === "" && <p className="text-destructive">Configure o endereço em <Link className="underline" to="/painel/instituto?secao=relatorios">Instituto → Dados para relatórios</Link> antes de imprimir.</p>}
    <Tabs value={tab} onValueChange={value => setParams({ tab: value })}><TabsList><TabsTrigger value="financeiro">Financeiro</TabsTrigger><TabsTrigger value="cursos">Cursos</TabsTrigger><TabsTrigger value="simposios">Simpósios</TabsTrigger></TabsList>
      <TabsContent value="financeiro" className="pt-4"><FinanceiroRelatorio /></TabsContent>
      <TabsContent value="cursos" className="pt-4"><CursosRelatorio /></TabsContent>
      <TabsContent value="simposios" className="pt-4"><SimposiosRelatorio /></TabsContent>
    </Tabs>
  </div>;
}
