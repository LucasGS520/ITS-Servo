import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import SiteLayout from "@/site/layout/SiteLayout";
import PainelLayout from "@/painel/layout/PainelLayout";

// Site Institucional
import Home from "@/site/pages/Home";
import QuemSomos from "@/site/pages/QuemSomos";
import Cursos from "@/site/pages/Cursos";
import Nucleos from "@/site/pages/Nucleos";
import Metodologia from "@/site/pages/Metodologia";
import Inscricao from "@/site/pages/Inscricao";
import Pagamento from "@/site/pages/Pagamento";
import ConsultaInscricao from "@/site/pages/ConsultaInscricao";
import NotFound from "@/site/pages/NotFound";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

// Painel Operacional
import Login from "@/painel/pages/Login";
import Dashboard from "@/painel/pages/Dashboard";
import Inscricoes from "@/painel/pages/Inscricoes";
import Financeiro from "@/painel/pages/Financeiro";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
        <Routes>
          {/* ── Site Institucional ── */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/quem-somos" element={<QuemSomos />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/nucleos" element={<Nucleos />} />
            <Route path="/metodologia" element={<Metodologia />} />
            <Route path="/inscricao" element={<Inscricao />} />
            <Route path="/inscricao/pagamento/:numero" element={<Pagamento />} />
            <Route path="/consulta" element={<ConsultaInscricao />} />
          </Route>

          {/* ── Painel Operacional ── */}
          <Route path="/painel/login" element={<Login />} />
          <Route path="/painel" element={<PainelLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inscricoes" element={<Inscricoes />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>

          {/* Retrocompatibilidade */}
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
