import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/common/ui/button";

const NotFoundPage = () => {
  const location = useLocation();
  useEffect(() => { console.error("404: rota inexistente na Central:", location.pathname); }, [location.pathname]);
  return <div className="flex min-h-screen items-center justify-center bg-muted px-4"><div className="text-center"><h1 className="mb-2 text-4xl font-bold">404</h1><p className="mb-1 text-xl text-muted-foreground">Página não encontrada</p><p className="mb-6 text-sm text-muted-foreground">Esta rota não faz parte da Central Operacional.</p><Button asChild variant="outline"><Link to="/consulta">Consultar minha inscrição</Link></Button></div></div>;
};

export default NotFoundPage;
