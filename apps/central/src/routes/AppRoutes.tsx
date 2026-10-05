import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AutosservicoLayout from "@/layouts/AutosservicoLayout";
import GestaoLayout from "@/layouts/GestaoLayout";
import NotFoundPage from "@/pages/NotFoundPage";
import RedirectToSite from "@/routes/RedirectToSite";
import { RequireGestaoAccess } from "@/modules/acesso/gestao";

const LoginPage = lazy(() => import("@/modules/acesso/gestao").then((modulo) => ({ default: modulo.LoginPage })));
const ConsultaInscricaoPage = lazy(() => import("@/modules/matriculas/autosservico").then((modulo) => ({ default: modulo.ConsultaInscricaoPage })));
const PagamentoPage = lazy(() => import("@/modules/matriculas/autosservico").then((modulo) => ({ default: modulo.PagamentoPage })));
const MatriculasPage = lazy(() => import("@/modules/matriculas/gestao").then((modulo) => ({ default: modulo.MatriculasPage })));
const FinanceiroPage = lazy(() => import("@/modules/financeiro/gestao").then((modulo) => ({ default: modulo.FinanceiroPage })));
const DashboardPage = lazy(() => import("@/modules/dashboard/gestao").then((modulo) => ({ default: modulo.DashboardPage })));
const ParticipantesPage = lazy(() => import("@/modules/participantes/gestao").then((modulo) => ({ default: modulo.ParticipantesPage })));
const CursosPage = lazy(() => import("@/modules/atividades/gestao/pages/AtividadesPages").then((modulo) => ({ default: modulo.CursosPage })));
const SimposioPage = lazy(() => import("@/modules/atividades/gestao/pages/AtividadesPages").then((modulo) => ({ default: modulo.SimposioPage })));
const AuditoriaPage = lazy(() => import("@/modules/auditoria/gestao").then((modulo) => ({ default: modulo.AuditoriaPage })));

const CarregandoRota = () => <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Carregando</span></div>;

const AppRoutes = () => <Suspense fallback={<CarregandoRota />}><Routes>
  <Route element={<AutosservicoLayout />}>
    <Route path="/inscricao/pagamento/:numero" element={<PagamentoPage />} />
    <Route path="/consulta" element={<ConsultaInscricaoPage />} />
  </Route>

  <Route path="/painel/login" element={<LoginPage />} />
  <Route path="/painel" element={<RequireGestaoAccess><GestaoLayout /></RequireGestaoAccess>}>
    <Route index element={<DashboardPage />} />
    <Route path="participantes" element={<ParticipantesPage />} />
    <Route path="matriculas" element={<MatriculasPage />} />
    <Route path="cursos" element={<CursosPage />} />
    <Route path="simposios" element={<SimposioPage />} />
    <Route path="financeiro" element={<FinanceiroPage />} />
    <Route path="relatorios" element={<Navigate to="/painel/financeiro?tab=mensal" replace />} />
    <Route path="auditoria" element={<AuditoriaPage />} />
    <Route path="pessoas" element={<Navigate to="/painel/participantes" replace />} />
    <Route path="inscricoes" element={<Navigate to="/painel/matriculas" replace />} />
    <Route path="simposio" element={<Navigate to="/painel/simposios" replace />} />
  </Route>

  <Route path="/" element={<RedirectToSite />} />
  <Route path="/quem-somos" element={<RedirectToSite path="/quem-somos" />} />
  <Route path="/cursos" element={<RedirectToSite path="/cursos" />} />
  <Route path="/nucleos" element={<RedirectToSite path="/nucleos" />} />
  <Route path="/metodologia" element={<RedirectToSite path="/metodologia" />} />
  <Route path="/inscricao" element={<RedirectToSite path="/inscricao" />} />
  <Route path="/admin/login" element={<Navigate to="/painel/login" replace />} />
  <Route path="/admin" element={<Navigate to="/painel" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes></Suspense>;

export default AppRoutes;
