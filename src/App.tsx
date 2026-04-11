// Importações de componentes de UI
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Importações de bibliotecas externas
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importações de páginas
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

// Inicializa o cliente de cache de queries do React Query
const queryClient = new QueryClient();

/**
 * Componente principal da aplicação (App)
 * 
 * Configura os provedores globais e rotas da aplicação:
 * - QueryClientProvider: Gerencia cache e estado das requisições HTTP
 * - TooltipProvider: Fornece contexto para componentes de tooltip
 * - Toasters: Componentes para exibição de notificações
 * - BrowserRouter: Habilita roteamento no navegador
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Componentes de notificação */}
      <Toaster />
      <Sonner />
      
      {/* Roteador e definição de rotas */}
      <BrowserRouter>
        <Routes>
          {/* Página inicial */}
          <Route path="/" element={<Index />} />
          
          {/* Páginas informativas */}
          <Route path="/quem-somos" element={<QuemSomos />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/nucleos" element={<Nucleos />} />
          <Route path="/metodologia" element={<Metodologia />} />
          
          {/* Páginas de inscrição e pagamento */}
          <Route path="/inscricao" element={<Inscricao />} />
          <Route path="/inscricao/pagamento/:numero" element={<Pagamento />} />
          <Route path="/consulta" element={<ConsultaInscricao />} />
          
          {/* Páginas administrativas */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          
          {/* Rota coringa para páginas não encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
