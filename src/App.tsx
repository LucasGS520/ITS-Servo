import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import QuemSomos from "./pages/QuemSomos";
import Cursos from "./pages/Cursos";
import Nucleos from "./pages/Nucleos";
import Metodologia from "./pages/Metodologia";
import Inscricao from "./pages/Inscricao";
import Pagamento from "./pages/Pagamento";
import ConsultaInscricao from "./pages/ConsultaInscricao";
import AdminLogin from "./pages/AdminLogin";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quem-somos" element={<QuemSomos />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/nucleos" element={<Nucleos />} />
          <Route path="/metodologia" element={<Metodologia />} />
          <Route path="/inscricao" element={<Inscricao />} />
          <Route path="/inscricao/pagamento/:numero" element={<Pagamento />} />
          <Route path="/consulta" element={<ConsultaInscricao />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
