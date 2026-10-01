import { Navigate, Route, Routes } from "react-router-dom";
import AutosservicoLayout from "@/app/layouts/AutosservicoLayout";
import GestaoLayout from "@/app/layouts/GestaoLayout";
import NotFoundPage from "@/app/pages/NotFoundPage";
import RedirectToSite from "@/app/routes/RedirectToSite";
import { LoginPage, RequireGestaoAccess } from "@/features/autenticacao/gestao";
import { ConsultaInscricaoPage, PagamentoPage } from "@/features/inscricoes/autosservico";
import { InscricoesPage } from "@/features/inscricoes/gestao";
import { FinanceiroPage } from "@/features/financeiro/gestao";
import { DashboardPage } from "@/features/indicadores/gestao";

const AppRoutes = () => (
  <Routes>
    <Route element={<AutosservicoLayout />}>
      <Route path="/inscricao/pagamento/:numero" element={<PagamentoPage />} />
      <Route path="/consulta" element={<ConsultaInscricaoPage />} />
    </Route>

    <Route path="/painel/login" element={<LoginPage />} />
    <Route
      path="/painel"
      element={(
        <RequireGestaoAccess>
          <GestaoLayout />
        </RequireGestaoAccess>
      )}
    >
      <Route index element={<DashboardPage />} />
      <Route path="inscricoes" element={<InscricoesPage />} />
      <Route path="financeiro" element={<FinanceiroPage />} />
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
  </Routes>
);

export default AppRoutes;
