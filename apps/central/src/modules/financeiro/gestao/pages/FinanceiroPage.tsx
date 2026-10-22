import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import LancamentosTab from "@/modules/financeiro/gestao/components/LancamentosTab";
import CategoriasTab from "@/modules/financeiro/gestao/components/CategoriasTab";

const TABS = ["lancamentos", "categorias"] as const;
type Tab = (typeof TABS)[number];

const FinanceiroPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("tab") as Tab | null;
  const tab: Tab = raw && TABS.includes(raw) ? raw : "lancamentos";
  useEffect(() => {
    if (raw && !TABS.includes(raw)) setSearchParams({ tab: "lancamentos" }, { replace: true });
  }, [raw, setSearchParams]);
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold text-foreground">Financeiro</h1><p className="mt-1 text-sm text-muted-foreground">Entradas, saídas, pagamentos e devoluções em um só lugar.</p></div><Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}><TabsList><TabsTrigger value="lancamentos">Movimentações</TabsTrigger><TabsTrigger value="categorias">Categorias</TabsTrigger></TabsList><TabsContent value="lancamentos" className="mt-6"><LancamentosTab /></TabsContent><TabsContent value="categorias" className="mt-6"><CategoriasTab /></TabsContent></Tabs></div>;
};

export default FinanceiroPage;
