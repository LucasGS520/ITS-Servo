import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import LancamentosTab from "@/modules/financeiro/gestao/components/LancamentosTab";
import MensalTab from "@/modules/financeiro/gestao/components/MensalTab";
import AnualTab from "@/modules/financeiro/gestao/components/AnualTab";
import AlunosTab from "@/modules/financeiro/gestao/components/AlunosTab";
import CategoriasTab from "@/modules/financeiro/gestao/components/CategoriasTab";
import PrevisaoTab from "@/modules/financeiro/gestao/components/PrevisaoTab";

const TABS = ["lancamentos", "mensal", "anual", "alunos", "categorias", "previsao"] as const;
type Tab = (typeof TABS)[number];

/**
 * Financeiro da Central — substitui a planilha anual do ITS.
 * Tab controlada por ?tab= para deep-link e sobrevivência ao refresh.
 */
const FinanceiroPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("tab") as Tab | null;
  const tab: Tab = raw && TABS.includes(raw) ? raw : "lancamentos";

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entradas e saídas por unidade — mensalidades, cursos e despesas do ITS.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="mensal">Relatório Mensal</TabsTrigger>
          <TabsTrigger value="anual">Visão Anual</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="previsao">Previsão</TabsTrigger>
        </TabsList>
        <TabsContent value="lancamentos" className="mt-6">
          <LancamentosTab />
        </TabsContent>
        <TabsContent value="mensal" className="mt-6">
          <MensalTab />
        </TabsContent>
        <TabsContent value="anual" className="mt-6">
          <AnualTab />
        </TabsContent>
        <TabsContent value="alunos" className="mt-6">
          <AlunosTab />
        </TabsContent>
        <TabsContent value="categorias" className="mt-6">
          <CategoriasTab />
        </TabsContent>
        <TabsContent value="previsao" className="mt-6">
          <PrevisaoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroPage;
