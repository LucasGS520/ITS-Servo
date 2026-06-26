import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

// Painel Operacional
import Login from "@/painel/pages/Login";
import Inscricoes from "@/painel/pages/Inscricoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/painel" element={<PainelLayout />}>
            <Route path="login" element={<Login />} />
            <Route index element={<Inscricoes />} />
          </Route>

          {/* Retrocompatibilidade: redireciona rotas antigas do /admin */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Inscricoes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
