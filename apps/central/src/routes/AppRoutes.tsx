import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AutosservicoLayout from "@/layouts/AutosservicoLayout";
import GestaoLayout from "@/layouts/GestaoLayout";
import NotFoundPage from "@/pages/NotFoundPage";
import { RequireGestaoAccess } from "@/modules/acesso/gestao";

const LoginPage = lazy(() => import("@/modules/acesso/gestao").then((modulo) => ({ default: modulo.LoginPage })));
const ConsultaInscricaoPage = lazy(() => import("@/modules/matriculas/autosservico").then((modulo) => ({ default: modulo.ConsultaInscricaoPage })));
const PagamentoPage = lazy(() => import("@/modules/matriculas/autosservico").then((modulo) => ({ default: modulo.PagamentoPage })));
const AtendimentoPage = lazy(() => import("@/modules/matriculas/gestao").then((modulo) => ({ default: modulo.MatriculasPage })));
const FinanceiroPage = lazy(() => import("@/modules/financeiro/gestao").then((modulo) => ({ default: modulo.FinanceiroPage })));
const DashboardPage = lazy(() => import("@/modules/dashboard/gestao").then((modulo) => ({ default: modulo.DashboardPage })));
const InstitutoPage = lazy(() => import("@/modules/instituto/gestao").then((modulo) => ({ default: modulo.InstitutoPage })));
const RelatoriosPage = lazy(() => import("@/modules/relatorios/gestao").then((modulo) => ({ default: modulo.RelatoriosPage })));

const CarregandoRota = () => <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Carregando</span></div>;

const AppRoutes = () => <Suspense fallback={<CarregandoRota />}><Routes>
  <Route element={<AutosservicoLayout />}>
    <Route path="/inscricao/pagamento/:numero" element={<PagamentoPage />} />
    <Route path="/consulta" element={<ConsultaInscricaoPage />} />
  </Route>

  <Route path="/painel/login" element={<LoginPage />} />
  <Route path="/painel" element={<RequireGestaoAccess><GestaoLayout /></RequireGestaoAccess>}>
    <Route index element={<DashboardPage />} />
    <Route path="atendimento" element={<AtendimentoPage />} />
    <Route path="financeiro" element={<FinanceiroPage />} />
    <Route path="instituto" element={<InstitutoPage />} />
    <Route path="relatorios" element={<RelatoriosPage />} />
  </Route>

  <Route path="/admin/login" element={<Navigate to="/painel/login" replace />} />
  <Route path="/admin" element={<Navigate to="/painel" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes></Suspense>;

export default AppRoutes;
