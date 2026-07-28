import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guard reutilizável da Central Operacional (admin).
 * Verifica sessão + papel `admin` (defesa em profundidade — a RLS já restringe
 * os dados). Enquanto checa, mostra spinner; sem autorização, redireciona para
 * o login. Renderiza os filhos apenas quando autorizado.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/painel/login"); return; }
        // UNIQUE é (user_id, role): um usuário pode ter várias roles. Filtrar
        // direto por admin evita que uma segunda role derrube o `.single()`.
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (error) throw error;
        if (!roles || roles.role !== "admin") {
          await supabase.auth.signOut();
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

export default ProtectedRoute;
