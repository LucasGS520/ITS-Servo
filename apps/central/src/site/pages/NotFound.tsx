import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Componente NotFound
 * 
 * Exibe uma página de erro 404 quando o usuário tenta acessar uma rota inexistente.
 * Registra no console a rota que foi tentada.
 */
const NotFound = () => {
  // Obtém a localização atual da rota
  const location = useLocation();

  // Efeito para registrar erros de rotas não encontradas
  useEffect(() => {
    // Registra a tentativa de acesso à rota inexistente no console
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        {/* Título principal do erro 404 */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Mensagem de descrição do erro */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* Link para retornar à página inicial */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
