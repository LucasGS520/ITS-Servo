import { Navigate, Route, Routes } from "react-router-dom";
import AutosservicoLayout from "@/layouts/AutosservicoLayout";
import GestaoLayout from "@/layouts/GestaoLayout";
import NotFoundPage from "@/pages/NotFoundPage";
import RedirectToSite from "@/routes/RedirectToSite";
import { LoginPage, RequireGestaoAccess } from "@/modules/autenticacao/gestao";
import { ConsultaInscricaoPage, PagamentoPage } from "@/modules/inscricoes/autosservico";
import { InscricoesPage } from "@/modules/inscricoes/gestao";
import { FinanceiroPage } from "@/modules/financeiro/gestao";
import { DashboardPage } from "@/modules/indicadores/gestao";
import { PessoasPage } from "@/modules/pessoas/gestao";
import { CursosPage, SimposioPage } from "@/modules/atividades/gestao/pages/AtividadesPages";

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
      <Route path="pessoas" element={<PessoasPage />} />
      <Route path="cursos" element={<CursosPage />} />
      <Route path="simposio" element={<SimposioPage />} />
      <Route path="relatorios" element={<Navigate to="/painel/financeiro?tab=mensal" replace />} />
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
