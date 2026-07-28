import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AutoServicoLayout from "@/site/layout/AutoServicoLayout";
import PainelLayout from "@/painel/layout/PainelLayout";

// Superfície pública de autosserviço (acesso por token da inscrição)
import Pagamento from "@/site/pages/Pagamento";
import ConsultaInscricao from "@/site/pages/ConsultaInscricao";
import NotFound from "@/site/pages/NotFound";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import RedirectToSite from "@/shared/components/RedirectToSite";

// Painel Operacional (admin autenticado)
import Login from "@/painel/pages/Login";
import Dashboard from "@/painel/pages/Dashboard";
import Inscricoes from "@/painel/pages/Inscricoes";
import Financeiro from "@/painel/pages/Financeiro";

const queryClient = new QueryClient();

/**
 * Central Operacional (Produto B) — SEM conteúdo institucional.
 *
 * Escopo desta aplicação (ver docs/arquitetura.md §3 e §4):
 *  1. Autosserviço público travado por token: pagamento e consulta.
 *  2. Painel administrativo autenticado: /painel/*.
 *
 * Conteúdo institucional e o formulário de inscrição pertencem ao Site
 * (Produto A) — as rotas antigas apenas redirecionam para lá.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            {/* ── Autosserviço público (token da inscrição) ── */}
            <Route element={<AutoServicoLayout />}>
              <Route path="/inscricao/pagamento/:numero" element={<Pagamento />} />
              <Route path="/consulta" element={<ConsultaInscricao />} />
            </Route>

            {/* ── Painel Operacional ── */}
            <Route path="/painel/login" element={<Login />} />
            <Route path="/painel" element={<ProtectedRoute><PainelLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="inscricoes" element={<Inscricoes />} />
              <Route path="financeiro" element={<Financeiro />} />
            </Route>

            {/* ── Rotas institucionais → Site (Produto A) ── */}
            <Route path="/" element={<RedirectToSite />} />
            <Route path="/quem-somos" element={<RedirectToSite path="/quem-somos" />} />
            <Route path="/cursos" element={<RedirectToSite path="/cursos" />} />
            <Route path="/nucleos" element={<RedirectToSite path="/nucleos" />} />
            <Route path="/metodologia" element={<RedirectToSite path="/metodologia" />} />
            <Route path="/inscricao" element={<RedirectToSite path="/inscricao" />} />

            {/* Retrocompatibilidade do painel */}
            <Route path="/admin/login" element={<Navigate to="/painel/login" replace />} />
            <Route path="/admin" element={<Navigate to="/painel" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
