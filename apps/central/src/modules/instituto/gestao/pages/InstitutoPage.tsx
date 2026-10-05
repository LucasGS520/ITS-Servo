import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/ui/tabs";
import { CursosPage, SimposioPage } from "@/modules/atividades/gestao/pages/AtividadesPages";
import AlunosTab from "@/modules/financeiro/gestao/components/AlunosTab";
import NucleosTab from "@/modules/instituto/gestao/components/NucleosTab";

const InstitutoPage = () => <div className="container space-y-6 py-8"><div><h1 className="text-2xl font-bold">Instituto</h1><p className="mt-1 text-sm text-muted-foreground">Configurações acadêmicas, núcleos, alunos ativos e simpósios.</p></div><Tabs defaultValue="cursos"><TabsList><TabsTrigger value="cursos">Cursos</TabsTrigger><TabsTrigger value="alunos">Alunos ativos</TabsTrigger><TabsTrigger value="simposios">Simpósios</TabsTrigger><TabsTrigger value="nucleos">Núcleos</TabsTrigger></TabsList><TabsContent value="cursos"><CursosPage /></TabsContent><TabsContent value="alunos"><AlunosTab /></TabsContent><TabsContent value="simposios"><SimposioPage /></TabsContent><TabsContent value="nucleos"><NucleosTab /></TabsContent></Tabs></div>;

export default InstitutoPage;
