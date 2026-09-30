import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/shared/constants/urls";

/**
 * 404 da Central. Oferece as duas saídas reais: o Site Institucional (todo
 * conteúdo público) e a consulta de inscrição (autosserviço).
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente na Central:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-1 text-xl text-muted-foreground">Página não encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          Esta é a área operacional do ITS. O conteúdo do instituto está no site.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href={SITE_URL}>Ir para o site do ITS</a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/consulta">Consultar minha inscrição</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
