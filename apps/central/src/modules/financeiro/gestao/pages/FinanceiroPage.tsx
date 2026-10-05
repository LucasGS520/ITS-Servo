import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import LancamentosTab from "@/modules/financeiro/gestao/components/LancamentosTab";
import CategoriasTab from "@/modules/financeiro/gestao/components/CategoriasTab";
import PrevisaoTab from "@/modules/financeiro/gestao/components/PrevisaoTab";
import CobrancasTab from "@/modules/financeiro/gestao/components/CobrancasTab";

const TABS = ["lancamentos", "cobrancas", "categorias", "previsao"] as const;
type Tab = (typeof TABS)[number];

const FinanceiroPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("tab") as Tab | null;
  const tab: Tab = raw && TABS.includes(raw) ? raw : "lancamentos";
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold text-foreground">Financeiro</h1><p className="mt-1 text-sm text-muted-foreground">Cobranças, confirmação de recebimento, movimentações e previsão.</p></div><Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}><TabsList><TabsTrigger value="lancamentos">Movimentações</TabsTrigger><TabsTrigger value="cobrancas">Cobranças</TabsTrigger><TabsTrigger value="categorias">Categorias</TabsTrigger><TabsTrigger value="previsao">Previsão</TabsTrigger></TabsList><TabsContent value="lancamentos" className="mt-6"><LancamentosTab /></TabsContent><TabsContent value="cobrancas" className="mt-6"><CobrancasTab /></TabsContent><TabsContent value="categorias" className="mt-6"><CategoriasTab /></TabsContent><TabsContent value="previsao" className="mt-6"><PrevisaoTab /></TabsContent></Tabs></div>;
};

export default FinanceiroPage;
