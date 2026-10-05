import AppProviders from "@/providers/AppProviders";
import AppRoutes from "@/routes/AppRoutes";

/**
 * Central Operacional (Produto B) — SEM conteúdo institucional.
 *
 * Escopo desta aplicação:
 *  1. Autosserviço público travado por token: pagamento e consulta.
 *  2. Painel administrativo autenticado: /painel/*.
 *
 * Conteúdo institucional e o formulário de inscrição pertencem ao Site
 * (Produto A) — as rotas antigas apenas redirecionam para lá.
 */
const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

export default App;
