import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import { CursosPage, SimposioPage } from "@/modules/atividades/gestao/pages/AtividadesPages";
import NucleosTab from "@/modules/instituto/gestao/components/NucleosTab";
import { useSearchParams } from "react-router-dom";
import { AlunosPage } from "./AlunosPage";

const InstitutoPage = () => {
  const [params, setParams] = useSearchParams();
  const secao = params.get("secao") ?? "cursos";
  return <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Instituto</h1><p className="mt-1 text-sm text-muted-foreground">Cursos, alunos, edições do Simpósio e núcleos.</p></div><Tabs value={secao} onValueChange={valor => setParams({ secao: valor })}><TabsList className="flex-wrap"><TabsTrigger value="cursos">Cursos</TabsTrigger><TabsTrigger value="alunos">Alunos</TabsTrigger><TabsTrigger value="simposios">Simpósios</TabsTrigger><TabsTrigger value="nucleos">Núcleos</TabsTrigger></TabsList><TabsContent value="cursos"><CursosPage /></TabsContent><TabsContent value="alunos"><AlunosPage /></TabsContent><TabsContent value="simposios"><SimposioPage /></TabsContent><TabsContent value="nucleos"><NucleosTab /></TabsContent></Tabs></div>;
};

export default InstitutoPage;
