import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { verificarAcessoGestao } from "@/modules/acesso/api";

/**
 * Guard reutilizável da Central Operacional (admin).
 * Verifica sessão + papel `admin` (defesa em profundidade — a RLS já restringe
 * os dados). Enquanto checa, mostra spinner; sem autorização, redireciona para
 * o login. Renderiza os filhos apenas quando autorizado.
 */
const RequireGestaoAccess = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        if (!(await verificarAcessoGestao())) {
          navigate("/painel/login");
          return;
        }
        setChecking(false);
      } catch {
        // Rede/erro inesperado: melhor voltar ao login do que spinner infinito.
        navigate("/painel/login");
      }
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireGestaoAccess;
